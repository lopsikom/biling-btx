import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { listPortalUserRolesPrisma } from '~~/server/utils/prisma/UserRole'
import { requireRole } from '~~/server/utils/requireRole'
import type { IUserRole } from '~~/shared/models/APIModels'

// Список пользователей портала с их ролью виджета. Кто из них ещё и админ Bitrix-
// портала — здесь не считается: это потребовало бы отдельного REST-вызова на
// каждого пользователя (user.admin проверяет только текущего вызывающего), а на
// итоговый доступ это не влияет — админский статус всё равно посчитается заново
// при резолве токена конкретного пользователя (см. requirePortal).
export default defineEventHandler(async (event): Promise<IUserRole[]> => {
  requireRole(event, 'admin')
  const portal = event.context.portal as PortalDataType
  return listPortalUserRolesPrisma(portal.portal.id)
})
