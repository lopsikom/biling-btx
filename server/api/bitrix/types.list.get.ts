import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { fault, refusal } from '~~/server/utils/errors'

// Список смарт-процессов портала — для выбора привязки договора в настройках
export default defineEventHandler(async (event) => {
  const portal = event.context.portal as PortalDataType
  const token = await getBitrixTokenByRedis(portal)
  if (!token) throw refusal('bitrix.token_expired', 502, { message: 'Приложение потеряло доступ к Bitrix24 — требуется переустановка' })
  try {
    const types = await bitrixAPI.getTypes(portal.portal.domain, token.access_token)
    return types.result.types.map(t => ({ entityTypeId: t.entityTypeId, title: t.title }))
  } catch (e) {
    throw fault('bitrix.api_error', { statusCode: 502, message: 'Не удалось получить список смарт-процессов' })
  }
})
