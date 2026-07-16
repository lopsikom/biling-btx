import * as z from 'zod'
import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import type { BitrixItem } from '~~/server/services/fieldMetadata'
import { buildValuesPayload, getFieldsMirror } from '~~/server/services/fieldMetadata'
import { eventsAudit, type EventEntity } from '~~/server/services/EventsAudit'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { contractToApi, getContractById, requireContract, upsertContractFromBitrix } from '~~/server/utils/prisma/modules/Contract'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import { requireRole } from '~~/server/utils/requireRole'
import { ContractUpdate, entityType } from '~~/shared/models/APIModels'

// Правка договора: Bitrix-first, field_values перезаписывается из ответа Bitrix (ADR-0005).
export default defineEventHandler(async (event) => {
  requireRole(event, 'manager')
  const id = getRouterParams(event).id
  const portal = event.context.portal as PortalDataType
  const body = await readBody(event)

  if (!id) throw createError({ statusCode: 404, statusMessage: 'none id' })

  try {
    const parseId = z.coerce.number().parse(id)
    const verify = await requireContract(parseId, portal.portal.id)
    if (!verify) throw createError({ statusCode: 404, statusMessage: 'not verify portal' })
    const existing = await getContractById(parseId)
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'no found contract' })

    const entityTypeId = portal.portal.contract_entity_type_id
    if (!entityTypeId) {
      throw createError({ statusCode: 409, statusMessage: 'Portal not configured', message: 'Не настроена привязка смарт-процесса договора' })
    }
    const data = await ContractUpdate.parseAsync(body)
    const token = await getBitrixTokenByRedis(portal)
    if (!token) throw createError({ statusCode: 502, statusMessage: 'Bitrix auth error', message: 'Не удалось получить токен Bitrix' })

    const mirror = await getFieldsMirror({
      portal_id: portal.portal.id,
      entity: 'contract',
      domain: portal.portal.domain,
      token: token.access_token,
      entityTypeId: entityTypeId
    })
    const { payload, errors } = buildValuesPayload(mirror, data.values ?? {}, { partial: true })
    if (errors.length) {
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: errors.join(', ') })
    }
    const fields: Record<string, unknown> = { ...payload }
    if (data.name) fields.title = data.name
    if (data.mycompany_id) fields.mycompanyId = data.mycompany_id
    if (data.assigned_by_id) fields.assignedById = data.assigned_by_id

    await acquireLock(existing.bitrix_id, portal.portal.id)
    try {
      const updated = await bitrixAPI.updateItem<BitrixItem>(portal.portal.domain, token.access_token, entityTypeId, existing.bitrix_id, fields)
      const item = updated.result.item
      if (!item) throw createError({ statusCode: 502, statusMessage: 'Bitrix error', message: 'Bitrix не вернул обновлённый договор' })
      const contract = await upsertContractFromBitrix(portal.portal.id, item)

      eventsAudit.emit('entity.update', {
        userid: portal?.user_id,
        entity: entityType.CONTRACT,
        entityName: contract.name,
        companyid: contract.company_id
      } as EventEntity)

      return contractToApi(contract)
    } finally {
      await releaseLock(existing.bitrix_id, portal.portal.id)
    }
  } catch (e) {
    console.error(e)
    if (e instanceof z.ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: mess })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
