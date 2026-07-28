import * as z from 'zod'
import companyClient from '~~/server/services/bitrix/CompanyClient'
import { deleteProducts } from '~~/server/utils/ProductBitrix'
import { eventsAudit, type EventEntity } from '~~/server/services/EventsAudit'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import { getModuleById, requireModule, deleteModuleByBitrixId } from '~~/server/utils/prisma/modules/Module'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { requireRole } from '~~/server/utils/requireRole'
import { entityType } from '~~/shared/models/APIModels'

// Удаление модуля: Bitrix-first (offer + product row), затем строка в БД.
export default defineEventHandler(async (event) => {
  requireRole(event, 'manager')
  const id = getRouterParams(event).id
  const portal = event.context.portal as PortalDataType
  if (!id) throw createError({ statusCode: 404, statusMessage: 'none id' })
  try {
    const parseId = z.coerce.number().parse(id)
    if (!(await requireModule(parseId, portal.portal.id))) throw createError({ statusCode: 404, statusMessage: 'not verify portal' })
    const module = await getModuleById(parseId, portal.portal.id)
    if (!module || !module.bitrix_id) throw createError({ statusCode: 404, statusMessage: 'no found module' })

    const contractBitrixId = module.contract?.bitrix_id
    if (contractBitrixId) await acquireLock(contractBitrixId, portal.portal.id)
    try {
      const company = new companyClient(portal.portal.domain, portal.portal.id, module.contract?.company?.bitrix_id ?? '')
      if (module.product_id) await deleteProducts(company, module.bitrix_id, module.product_id)
      const deleted = await deleteModuleByBitrixId(module.bitrix_id, portal.portal.id)
      eventsAudit.emit('entity.delete', {
        userid: portal.user_id, entity: entityType.MODULE, entityName: deleted.title
      } as unknown as EventEntity)
      return true
    } finally {
      if (contractBitrixId) await releaseLock(contractBitrixId, portal.portal.id)
    }
  } catch (e) {
    console.error(e)
    if (e instanceof z.ZodError) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
