import { ZodError } from 'zod'
import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import type { BitrixItem } from '~~/server/services/fieldMetadata'
import { buildValuesPayload, getFieldsMirror } from '~~/server/services/fieldMetadata'
import type { EventEntity } from '~~/server/services/EventsAudit'
import { eventsAudit } from '~~/server/services/EventsAudit'
import { saveShapshotProduct } from '~~/server/services/webHooksEvents'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { contractToApi, upsertContractFromBitrix } from '~~/server/utils/prisma/modules/Contract'
import getMyCompanysCache from '~~/server/utils/redis/getMyCompanys'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import { requireRole } from '~~/server/utils/requireRole'
import { ContractPost, entityType } from '~~/shared/models/APIModels'
import { fault, refusal, zodFields } from '~~/server/utils/errors'
import { isError } from 'h3'

// Создание договора: Bitrix-first (ADR-0002), field_values — из ответа Bitrix (ADR-0005).
export default defineEventHandler(async (event) => {
  requireRole(event, 'manager')
  const portal = event.context.portal as PortalDataType
  const body = await readBody(event)
  try {
    const ZBody = await ContractPost.parseAsync(body)
    const entityTypeId = portal.portal.contract_entity_type_id
    if (!entityTypeId) {
      throw refusal('portal.not_configured', 409, { message: 'Не настроена привязка смарт-процесса договора' })
    }
    const token = await getBitrixTokenByRedis(portal)
    if (!token) throw refusal('bitrix.token_expired', 502, { message: 'Приложение потеряло доступ к Bitrix24 — требуется переустановка' })

    const mirror = await getFieldsMirror({
      portal_id: portal.portal.id,
      entity: 'contract',
      domain: portal.portal.domain,
      token: token.access_token,
      entityTypeId: entityTypeId
    })
    const { payload, errors } = buildValuesPayload(mirror, ZBody.values)
    if (errors.length) {
      throw refusal('validation.failed', 400, { message: errors.join(', ') })
    }

    const myCompanys = await getMyCompanysCache(portal, token.access_token)
    const fields: Record<string, unknown> = {
      title: ZBody.name,
      opened: 'N',
      assignedById: ZBody.assigned_by_id ?? Number(portal.bitrix_user_id),
      companyId: ZBody.bitrix_id ? Number(ZBody.bitrix_id) : undefined,
      mycompanyId: ZBody.mycompany_id ?? myCompanys[0]?.id,
      ...payload
    }
    const created = await bitrixAPI.addItem<BitrixItem>(portal.portal.domain, token.access_token, entityTypeId, fields)
    const item = created.result.item
    if (!item) throw fault('bitrix.api_error', { statusCode: 502, message: 'Bitrix не вернул созданный договор' })

    await acquireLock(item.id, portal.portal.id)
    try {
      const contract = await upsertContractFromBitrix(portal.portal.id, item)
      setResponseStatus(event, 201)
      eventsAudit.emit('entity.create', {
        userid: portal?.user_id,
        entity: entityType.CONTRACT,
        entityName: contract.name,
        companyid: contract.company_id
      } as EventEntity)
      await saveShapshotProduct(contract.bitrix_id, portal.portal.id, [])
      return contractToApi(contract)
    } finally {
      await releaseLock(item.id, portal.portal.id)
    }
  } catch (e) {
    if (e instanceof ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw refusal('validation.failed', 400, { message: mess, details: zodFields(e) })
    }
    if (isError(e)) throw e
    throw fault('internal', { cause: e })
  }
})
