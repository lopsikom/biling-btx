import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { listPortalUserRolesPrisma } from '~~/server/utils/prisma/UserRole'
import { requireRole } from '~~/server/utils/requireRole'
import type { IUserRole } from '~~/shared/models/APIModels'

// Список пользователей портала с их ролью виджета (включая 'admin' — грант,
// ADR-0008). Кто из них ещё и админ Bitrix-портала — здесь не считается: это
// потребовало бы отдельного REST-вызова на каждого пользователя (user.admin
// проверяет только текущего вызывающего). На итоговый доступ это не влияет —
// он всё равно пересчитывается при резолве токена конкретного пользователя
// (см. requirePortal): показанная здесь роль может быть *ниже* фактической,
// если пользователь — Bitrix-админ, но выше показанного её не занизить.
export default defineEventHandler(async (event): Promise<IUserRole[]> => {
  requireRole(event, 'admin')
  const portal = event.context.portal as PortalDataType
  return listPortalUserRolesPrisma(portal.portal.id)
})
