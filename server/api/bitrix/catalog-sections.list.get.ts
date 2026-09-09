import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { PRODUCT_IBLOCK_ID } from '~~/server/services/catalogMetadata'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { fault, refusal } from '~~/server/utils/errors'

// Разделы каталога товаров — для каскадного выбора корневого раздела видов
// модулей на экране установки приложения (portal binding).
export default defineEventHandler(async (event) => {
  const portal = event.context.portal as PortalDataType
  const token = await getBitrixTokenByRedis(portal)
  if (!token) throw refusal('bitrix.token_expired', 502, { message: 'Приложение потеряло доступ к Bitrix24 — требуется переустановка' })
  try {
    const sectionsResp = await bitrixAPI.getCatalogSections(portal.portal.domain, token.access_token, PRODUCT_IBLOCK_ID)
    return sectionsResp.result.sections
  } catch (e) {
    throw fault('bitrix.api_error', { statusCode: 502, message: 'Не удалось получить список разделов каталога' })
  }
})  
