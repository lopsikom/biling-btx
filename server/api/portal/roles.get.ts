import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { listPortalUserRolesPrisma } from '~~/server/utils/prisma/UserRole'
import { requireRole } from '~~/server/utils/requireRole'
import type { IUserRole } from '~~/shared/models/APIModels'

export default defineEventHandler(async (event): Promise<IUserRole[]> => {
  requireRole(event, 'admin')
  const portal = event.context.portal as PortalDataType
  return listPortalUserRolesPrisma(portal.portal.id)
})
