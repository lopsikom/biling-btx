import { getCatalogMirror, moduleFieldsForProduct } from '~~/server/services/catalogMetadata'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import { getFieldGroupsByKind } from '~~/server/utils/prisma/FieldGroup'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { IModuleMetadataResponse } from '~~/shared/models/APIModels'

// Зеркало метаданных каталога: виды модулей + поля каждого вида (ADR-0006).
// ?refresh=1 — принудительное обновление из Bitrix.
export default defineEventHandler(async (event): Promise<IModuleMetadataResponse> => {
  const portalCtx = event.context.portal as PortalDataType
  const portal = await getPortal({ id: portalCtx.portal.id })
  const rootSectionId = portal?.module_root_section_id
  if (!rootSectionId) return { configured: false, kinds: [], fieldsByKind: {}, groupsByKind: {} }

  const token = await getBitrixTokenByRedis(portalCtx)
  if (!token) throw createError({ statusCode: 502, statusMessage: 'Bitrix auth error', message: 'Не удалось получить токен Bitrix' })

  try {
    const mirror = await getCatalogMirror({
      portal_id: portal!.id,
      domain: portal!.domain,
      token: token.access_token,
      rootSectionId,
      force: getQuery(event).refresh === '1'
    })
    // Виды выведены зеркалом из раздела — берём их из productNames.
    const productIds = Object.keys(mirror.productNames).map(Number)
    const kinds = productIds.map((id) => {
      const catId = mirror.categoryByProduct?.[id] ?? null
      return {
        parent_product_id: id,
        name: mirror.productNames[id] ?? `Товар ${id}`,
        category_id: catId,
        category_name: catId != null ? (mirror.categoryNames?.[catId] ?? null) : null
      }
    })
    const fieldsByKind: Record<number, ReturnType<typeof moduleFieldsForProduct>> = {}
    for (const id of productIds) fieldsByKind[id] = moduleFieldsForProduct(mirror, id)
    const groupsByKind = await getFieldGroupsByKind(portal!.id)
    return { configured: true, kinds, fieldsByKind, groupsByKind }
  } catch (e) {
    console.error('[metadata/module] не удалось получить метаданные каталога', e)
    throw createError({ statusCode: 502, statusMessage: 'Bitrix error', message: 'Не удалось получить описания полей каталога' })
  }
})
