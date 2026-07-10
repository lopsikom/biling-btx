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
import { ContractPost, entityType } from '~~/shared/models/APIModels'

// Создание договора: Bitrix-first (ADR-0002), field_values — из ответа Bitrix (ADR-0005).
export default defineEventHandler(async (event) => {
  const portal = event.context.portal as PortalDataType
  const body = await readBody(event)
  try {
    const ZBody = await ContractPost.parseAsync(body)
    const entityTypeId = portal.portal.contract_entity_type_id
    if (!entityTypeId) {
      throw createError({ statusCode: 409, statusMessage: 'Portal not configured', message: 'Не настроена привязка смарт-процесса договора' })
    }
    const token = await getBitrixTokenByRedis(portal)
    if (!token) throw createError({ statusCode: 502, statusMessage: 'Bitrix auth error', message: 'Не удалось получить токен Bitrix' })

    const mirror = await getFieldsMirror({
      portal_id: portal.portal.id,
      entity: 'contract',
      domain: portal.portal.domain,
      token: token.access_token,
      entityTypeId: entityTypeId
    })
    const { payload, errors } = buildValuesPayload(mirror, ZBody.values)
    if (errors.length) {
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: errors.join(', ') })
    }

    const myCompanys = await getMyCompanysCache(portal, token.access_token)
    const fields: Record<string, unknown> = {
      title: ZBody.name,
      opened: 'N',
      assignedById: Number(portal.bitrix_user_id),
      companyId: ZBody.bitrix_id ? Number(ZBody.bitrix_id) : undefined,
      mycompanyId: ZBody.mycompany_id ?? myCompanys[0]?.id,
      ...payload
    }
    const created = await bitrixAPI.addItem<BitrixItem>(portal.portal.domain, token.access_token, entityTypeId, fields)
    const item = created.result.item
    if (!item) throw createError({ statusCode: 502, statusMessage: 'Bitrix error', message: 'Bitrix не вернул созданный договор' })

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
    console.error(e)
    if (e instanceof ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: mess })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
