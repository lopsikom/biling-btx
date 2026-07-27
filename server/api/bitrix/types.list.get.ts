import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'

// Список смарт-процессов портала — для выбора привязки договора в настройках
export default defineEventHandler(async (event) => {
  const portal = event.context.portal as PortalDataType
  const token = await getBitrixTokenByRedis(portal)
  if (!token) throw createError({ statusCode: 502, statusMessage: 'Bitrix auth error', message: 'Не удалось получить токен Bitrix' })
  try {
    const types = await bitrixAPI.getTypes(portal.portal.domain, token.access_token)
    return types.result.types.map(t => ({ entityTypeId: t.entityTypeId, title: t.title }))
  } catch (e) {
    console.error('[bitrix/types.list] ошибка crm.type.list', e)
    throw createError({ statusCode: 502, statusMessage: 'Bitrix error', message: 'Не удалось получить список смарт-процессов' })
  }
})
