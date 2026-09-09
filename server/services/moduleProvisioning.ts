import companyClient from '~~/server/services/bitrix/CompanyClient'
import { eventsAudit, type EventEntity } from '~~/server/services/EventsAudit'
import { getShapshotProduct, saveShapshotProduct } from '~~/server/services/webHooksEvents'
import { getContractById } from '~~/server/utils/prisma/modules/Contract'
import { upsertModuleFromBitrix } from '~~/server/utils/prisma/modules/Module'
import { setProductBitrix, updateProductBitrix } from '~~/server/utils/ProductBitrix'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import { getCatalogMirror } from '~~/server/services/catalogMetadata'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { IProductCatalogCreate } from '~~/shared/models/bitrixModels'
import type { IModulePost, IModuleUpdate } from '~~/shared/models/APIModels'
import { entityType } from '~~/shared/models/APIModels'
import { buildOfferPayload } from './catalogMetadata'
import { refusal } from '~~/server/utils/errors'

/**
 * Провижининг модуля (module provisioning, см. CONTEXT.md) после коллапса видов.
 * Единый сценарий для любого вида: Bitrix-first (ADR-0002) — offer (свойства из values
 * по метаданным каталога) + product row → строка в module (replace-зеркало, ADR-0005).
 * Лок по договору, snapshot, аудит — здесь.
 */
export async function provisionModule(body: IModulePost, ctx: PortalDataType) {
  const contract = await getContractById(body.contract_id)
  if (!contract || !contract.bitrix_id) throw createError({ statusCode: 404, statusMessage: 'No found contract' })

  const token = await getBitrixTokenByRedis(ctx)
  if (!token) throw refusal('bitrix.token_expired', 502, { message: 'Приложение потеряло доступ к Bitrix24 — требуется переустановка' })

  const portalRow = await getPortal({ id: ctx.portal.id })
  const mirror = await getCatalogMirror({
    portal_id: ctx.portal.id, domain: ctx.portal.domain, token: token.access_token,
    rootSectionId: portalRow?.module_root_section_id ?? 0
  })
  const offerProps = buildOfferPayload(mirror, body.parent_product_id, body.values)

  await acquireLock(contract.bitrix_id, ctx.portal.id)
  try {
    const company = new companyClient(ctx.portal.domain, ctx.portal.id, contract.company.bitrix_id)
    const product = await setProductBitrix<IProductCatalogCreate>(
      company,
      { contract_id: contract.bitrix_id, data: { price: body.price, productName: body.title } },
      { parent_id: body.parent_product_id, data: { name: body.title, active: body.active ? 'Y' : 'N', ...offerProps } as unknown as IProductCatalogCreate }
    )

    const module = await upsertModuleFromBitrix(ctx.portal.id, {
      bitrix_id: product.productRow.result.productRow.id,
      product_id: product.productCatalog.result.offer.id,
      parent_product_id: body.parent_product_id,
      contract_bitrix_id: contract.bitrix_id,
      title: body.title,
      price: body.price,
      quantity: body.quantity,
      active: body.active,
      field_values: body.values
    })

    const snapshot = await getShapshotProduct(contract.bitrix_id, ctx.portal.id)
    await saveShapshotProduct(contract.bitrix_id, ctx.portal.id, [
      ...snapshot,
      { bitrix_id: product.productRow.result.productRow.id, portal_id: ctx.portal.id, type: String(body.parent_product_id) }
    ])

    eventsAudit.emit('entity.create', {
      userid: ctx.user_id, entity: entityType.MODULE, entityName: module.title, companyid: module.contract?.company_id
    } as EventEntity)

    return module
  } finally {
    await releaseLock(contract.bitrix_id, ctx.portal.id)
  }
}

/**
 * Обновление модуля. Bitrix-first: обновляем offer (свойства из values) + product row,
 * затем строку module (replace-зеркало из тела — фронт прислал желаемое состояние).
 */
export async function updateModuleProvisioning(id: number, body: IModuleUpdate, ctx: PortalDataType) {
  const { getModuleById } = await import('~~/server/utils/prisma/modules/Module')
  const old = await getModuleById(id, ctx.portal.id)
  if (!old || !old.bitrix_id) throw createError({ statusCode: 404, statusMessage: 'No found module' })
  if (!old.contract?.bitrix_id) throw createError({ statusCode: 409, statusMessage: 'Module without contract' })

  const token = await getBitrixTokenByRedis(ctx)
  if (!token) throw refusal('bitrix.token_expired', 502, { message: 'Приложение потеряло доступ к Bitrix24 — требуется переустановка' })

  const portalRow = await getPortal({ id: ctx.portal.id })
  const mirror = await getCatalogMirror({
    portal_id: ctx.portal.id, domain: ctx.portal.domain, token: token.access_token,
    rootSectionId: portalRow?.module_root_section_id ?? 0
  })
  const offerProps = body.values ? buildOfferPayload(mirror, old.parent_product_id, body.values) : undefined

  await acquireLock(old.contract.bitrix_id, ctx.portal.id)
  try {
    const company = new companyClient(ctx.portal.domain, ctx.portal.id, old.contract.company.bitrix_id)
    await updateProductBitrix<IProductCatalogCreate>(company, {
      rowBody: { row_id: old.bitrix_id, body: { productName: body.title ?? old.title, price: body.price ?? old.price } },
      catalogBody: offerProps && old.product_id ? { product_id: old.product_id, body: offerProps as unknown as Partial<IProductCatalogCreate> } : undefined
    })

    const module = await upsertModuleFromBitrix(ctx.portal.id, {
      bitrix_id: old.bitrix_id,
      product_id: old.product_id,
      parent_product_id: old.parent_product_id,
      contract_bitrix_id: old.contract.bitrix_id,
      title: body.title ?? old.title,
      price: body.price ?? old.price,
      quantity: body.quantity ?? old.quantity,
      active: body.active ?? old.active,
      field_values: { ...(old.field_values as Record<string, unknown>), ...(body.values ?? {}) }
    })

    eventsAudit.emit('entity.update', {
      userid: ctx.user_id, entity: entityType.MODULE, entityName: module.title, companyid: module.contract?.company_id
    } as EventEntity)

    return module
  } finally {
    await releaseLock(old.contract.bitrix_id, ctx.portal.id)
  }
}
