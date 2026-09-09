import * as z from 'zod'
import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { eventsAudit, type EventEntity } from '~~/server/services/EventsAudit'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { deleteContractPrisma, getContractById, requireContract } from '~~/server/utils/prisma/modules/Contract'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import { requireRole } from '~~/server/utils/requireRole'
import { entityType } from '~~/shared/models/APIModels'
import { fault, refusal } from '~~/server/utils/errors'
import { isError } from 'h3'

// Удаление договора: Bitrix-first, затем БД (вебхук DELETE скипнется по локу).
export default defineEventHandler(async (event) => {
  requireRole(event, 'manager')
  const id = getRouterParams(event).id
  const portal = event.context.portal as PortalDataType
  if (!id) throw createError({ statusCode: 404, statusMessage: 'none id' })
  try {
    const parseId = z.coerce.number().parse(id)
    const verify = await requireContract(parseId, portal.portal.id)
    if (!verify) throw fault('tenant.violation', { statusCode: 404, message: 'Запрошен объект другого портала' })
    const existing = await getContractById(parseId)
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'no found contract' })

    const entityTypeId = portal.portal.contract_entity_type_id
    if (!entityTypeId) {
      throw refusal('portal.not_configured', 409, { message: 'Не настроена привязка смарт-процесса договора' })
    }
    const token = await getBitrixTokenByRedis(portal)
    if (!token) throw refusal('bitrix.token_expired', 502, { message: 'Приложение потеряло доступ к Bitrix24 — требуется переустановка' })

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
    if (e instanceof z.ZodError) {
      throw refusal('validation.failed', 400, { message: 'Некорректный id' })
    }
    if (isError(e)) throw e
    throw fault('internal', { cause: e })
  }
})
