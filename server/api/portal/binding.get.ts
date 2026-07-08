import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { IPortalBinding } from '~~/shared/models/APIModels'

// Текущая привязка портала (portal binding, см. CONTEXT.md)
export default defineEventHandler(async (event): Promise<IPortalBinding> => {
  const portalCtx = event.context.portal as PortalDataType
  const portal = await getPortal({ id: portalCtx.portal.id })
  if (!portal) throw createError({ statusCode: 404, statusMessage: 'Portal not found' })
  return {
    contract_entity_type_id: portal.contract_entity_type_id,
    module_product_ids: portal.module_product_ids,
    module_root_section_id: portal.module_root_section_id
  }
})
