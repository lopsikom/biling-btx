import { getCatalogMirror, moduleFieldsForProduct } from '~~/server/services/catalogMetadata'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { IModuleMetadataResponse } from '~~/shared/models/APIModels'

// Зеркало метаданных каталога: виды модулей + поля каждого вида (ADR-0006).
// ?refresh=1 — принудительное обновление из Bitrix.
export default defineEventHandler(async (event): Promise<IModuleMetadataResponse> => {
  const portalCtx = event.context.portal as PortalDataType
  const portal = await getPortal({ id: portalCtx.portal.id })
  const productIds = portal?.module_product_ids ?? []
  if (!productIds.length) return { configured: false, kinds: [], fieldsByKind: {} }

  const token = await getBitrixTokenByRedis(portalCtx)
  if (!token) throw createError({ statusCode: 502, statusMessage: 'Bitrix auth error', message: 'Не удалось получить токен Bitrix' })

  try {
    const mirror = await getCatalogMirror({
      portal_id: portal!.id,
      domain: portal!.domain,
      token: token.access_token,
      productIds,
      force: getQuery(event).refresh === '1'
    })
    const kinds = productIds.map(id => ({ parent_product_id: id, name: mirror.productNames[id] ?? `Товар ${id}` }))
    const fieldsByKind: Record<number, ReturnType<typeof moduleFieldsForProduct>> = {}
    for (const id of productIds) fieldsByKind[id] = moduleFieldsForProduct(mirror, id)
    return { configured: true, kinds, fieldsByKind }
  } catch (e) {
    console.error('[metadata/module] не удалось получить метаданные каталога', e)
    throw createError({ statusCode: 502, statusMessage: 'Bitrix error', message: 'Не удалось получить описания полей каталога' })
  }
})
