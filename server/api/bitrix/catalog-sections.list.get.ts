import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { PRODUCT_IBLOCK_ID } from '~~/server/services/catalogMetadata'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'

// Разделы каталога товаров — для каскадного выбора корневого раздела видов
// модулей на экране установки приложения (portal binding).
export default defineEventHandler(async (event) => {
  const portal = event.context.portal as PortalDataType
  const token = await getBitrixTokenByRedis(portal)
  if (!token) throw createError({ statusCode: 502, statusMessage: 'Bitrix auth error', message: 'Не удалось получить токен Bitrix' })
  try {
    const sectionsResp = await bitrixAPI.getCatalogSections(portal.portal.domain, token.access_token, PRODUCT_IBLOCK_ID)
    return sectionsResp.result.sections
  } catch (e) {
    console.error('[bitrix/catalog-sections.list] ошибка catalog.section.list', e)
    throw createError({ statusCode: 502, statusMessage: 'Bitrix error', message: 'Не удалось получить список разделов каталога' })
  }
})
