import type { H3Event } from 'h3'
import type { Role } from '~~/shared/models/APIModels'
import type { AuthedPortalDataType } from './prisma/getPortalByUserBitrix'

const roleRank: Record<Role, number> = { viewer: 0, manager: 1, admin: 2 }

// Серверная проверка роли (ADR-0007) — единственный барьер, бэк ходит в Bitrix
// под app-токеном, а не токеном пользователя, так что сам Bitrix мутацию не остановит.
export function requireRole(event: H3Event, minRole: Role) {
  const portal = event.context.portal as AuthedPortalDataType
  if (roleRank[portal.role] < roleRank[minRole]) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `requires role >= ${minRole}, got ${portal.role}`
    })
  }
}
