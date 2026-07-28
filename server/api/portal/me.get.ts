import type { AuthedPortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { Role } from '~~/shared/models/APIModels'

// Роль текущего пользователя — фронт использует для скрытия недоступного UI.
// Источник правды — сервер (см. ADR-0007): это ровно то, что уже вычислил requirePortal.
export default defineEventHandler((event): { role: Role } => {
  const portal = event.context.portal as AuthedPortalDataType
  return { role: portal.role }
})
