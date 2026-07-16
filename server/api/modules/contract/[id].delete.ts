import * as z from 'zod'
import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { eventsAudit, type EventEntity } from '~~/server/services/EventsAudit'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { deleteContractPrisma, getContractById, requireContract } from '~~/server/utils/prisma/modules/Contract'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import { requireRole } from '~~/server/utils/requireRole'
import { entityType } from '~~/shared/models/APIModels'

// Удаление договора: Bitrix-first, затем БД (вебхук DELETE скипнется по локу).
export default defineEventHandler(async (event) => {
  requireRole(event, 'manager')
  const id = getRouterParams(event).id
  const portal = event.context.portal as PortalDataType
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
    const token = await getBitrixTokenByRedis(portal)
    if (!token) throw createError({ statusCode: 502, statusMessage: 'Bitrix auth error', message: 'Не удалось получить токен Bitrix' })

    await acquireLock(existing.bitrix_id, portal.portal.id)
    try {
      await bitrixAPI.deleteItem(portal.portal.domain, token.access_token, entityTypeId, existing.bitrix_id)
      const contract = await deleteContractPrisma(parseId)
      eventsAudit.emit('entity.delete', {
        userid: portal?.user_id,
        entity: entityType.CONTRACT,
        entityName: contract.name,
        companyid: contract.company_id
      } as EventEntity)
      return true
    } finally {
      await releaseLock(existing.bitrix_id, portal.portal.id)
    }
  } catch (e) {
    console.error(e)
    if (e instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
