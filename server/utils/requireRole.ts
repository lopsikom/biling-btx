import type { H3Event } from 'h3'
import type { Role } from '~~/shared/models/APIModels'
import type { AuthedPortalDataType } from './prisma/getPortalByUserBitrix'

const roleRank: Record<Role, number> = { viewer: 0, manager: 1, admin: 2 }

export function requireRole(event: H3Event, minRole: Role) {
  const portal = event.context.portal as AuthedPortalDataType
  if (portal.role && roleRank[portal.role] < roleRank[minRole]) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `requires role >= ${minRole}, got ${portal.role}`
    })
  }
}

