import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { PRODUCT_IBLOCK_ID, collectSectionSubtree } from '~~/server/services/catalogMetadata'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'

// Кол-во товаров в поддереве раздела каталога — предупреждение (не блокирует)
// на установке, если выбранная папка пока пуста.
export default defineEventHandler(async (event) => {
  const portal = event.context.portal as PortalDataType
  const sectionId = Number(getQuery(event).sectionId)
  if (!sectionId) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'sectionId обязателен' })
  const token = await getBitrixTokenByRedis(portal)
  if (!token) throw createError({ statusCode: 502, statusMessage: 'Bitrix auth error', message: 'Не удалось получить токен Bitrix' })
  try {
    const sectionsResp = await bitrixAPI.getCatalogSections(portal.portal.domain, token.access_token, PRODUCT_IBLOCK_ID)
    const sectionIds = collectSectionSubtree(sectionsResp.result.sections, sectionId)
    const products = await bitrixAPI.getCatalogProductsBySection(portal.portal.domain, token.access_token, PRODUCT_IBLOCK_ID, sectionIds)
    return { productCount: products.result.products.length }
  } catch (e) {
    console.error('[bitrix/catalog-sections/products-count] ошибка подсчёта товаров раздела', e)
    throw createError({ statusCode: 502, statusMessage: 'Bitrix error', message: 'Не удалось посчитать товары раздела' })
  }
})
