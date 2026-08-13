import { useNuxtApp } from 'nuxt/app'
import bitrixAPI from '../services/bitrix/bitrixAPI'
import type { PortalDataType } from '../utils/prisma/getPortalByUserBitrix'
import getPortalByUserBitrix from '../utils/prisma/getPortalByUserBitrix'
import redisCheck from '../plugins/redis-check'
import { redisClient } from '../services/redis'
import { getUserRolePrisma } from '../utils/prisma/UserRole'
import type { Role } from '~~/shared/models/APIModels'

// Финальная роль = максимум из двух источников (ADR-0007, ADR-0008):
// 'admin', если пользователь админ Bitrix-портала (вычисляется, не хранится),
// ИЛИ явный грант из БД (в т.ч. 'admin' — грант виджета, независимый от Bitrix),
// иначе дефолт 'viewer'. isBitrixAdmin кешируется вместе с токеном (300с) — это
// внешний REST-вызов; грант читается из БД на каждый запрос, чтобы отзыв
// действовал сразу.
async function resolveRole(portalId: number, userBitrixId: number, isBitrixAdmin: boolean): Promise<Role> {
  if (isBitrixAdmin) return 'admin'
  return getUserRolePrisma(portalId, userBitrixId)
}

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api')) return
  if (event.path.startsWith('/api/oauth')) return
  if (event.path.startsWith('/api/bitrix/webhook')) return
  const token = getHeader(event, 'Authorization')
  if (!token) {
    if (process.env.NUXT_PUBLIC_DEV && process.env.NUXT_DEV_SKIP_AUTH) {
      const devPortal = await getPortal({ id: Number(process.env.NUXT_DEV_PORTAL_ID) }).catch(() => null)
      event.context.portal = {
        portal: devPortal ?? {
          id: Number(process.env.NUXT_DEV_PORTAL_ID),
          client_id: process.env.NUXT_DEV_CLIENT_ID,
          client_secret: process.env.NUXT_DEV_CLIENT_SECRET,
          domain: process.env.NUXT_DEV_DOMAIN,
          refresh_token: process.env.NUXT_DEV_REFRESH_TOKEN,
          contract_entity_type_id: Number(process.env.NUXT_DEV_CONTRACT_TYPE_ID ?? 1058),
          module_product_ids: []
        },
        user_id: Number(process.env.NUXT_DEV_USER_ID),
        bitrix_user_id: process.env.NUXT_DEV_USER_BITRIX_ID,
        role: (process.env.NUXT_DEV_ROLE as Role | undefined) ?? 'admin'
      } as PortalDataType
      return
    } else {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'none token'
      })
    }
  }
  try {
    const cachePortal = await redisClient.get(`token:${token}`)
    if (cachePortal) {
      const cached = JSON.parse(cachePortal)
      const role = await resolveRole(cached.portal.id, cached.user_id, cached.isBitrixAdmin)
      event.context.portal = { ...cached, role }
      return
    }
    const portal = await getPortalByUserBitrix(token)
    if (!portal) throw createError({
      statusCode: 404,
      statusMessage: 'Unauthorized',
      message: 'none find portal'
    })
    const { client_secret, ...data } = portal.portal
    const isBitrixAdmin = await bitrixAPI.getUserAdmin(data.domain, token).then(r => r.result).catch(() => false)
    const newPortal = { portal: data, user_id: portal.user_id, bitrix_user_id: portal.bitrix_user_id, isBitrixAdmin }
    await redisClient.set(`token:${token}`, JSON.stringify(newPortal), 'EX', 300)
    const role = await resolveRole(data.id, portal.user_id, isBitrixAdmin)
    const a ={ ...newPortal, role }
    event.context.portal = { ...newPortal, role }
  } catch (e) {
    console.error(e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Unauthorized',
      message: 'app error'
    })
  }
})
