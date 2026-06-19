import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { eventsAudit, type EventEntity } from '~~/server/services/EventsAudit'
import { getShapshotProduct, saveShapshotProduct } from '~~/server/services/webHooksEvents'
import {
  productFuncCreateRecord,
  productFuncUpsertRecord,
  productFuncDeleteRecord
} from '~~/server/utils/prisma/modules/productFuncs'
import { productByParentId, ProductToEntityRecord, type IProductRow, type ProductEnum } from '~~/shared/models/bitrixModels'
import type { ReconcileArgs, ReconcileSummary, ResolvedProduct, SnapshotRow } from './types'

type ProductFunc = (data: { info: ResolvedProduct['product'], productRows: IProductRow }, portal_id: number) => Promise<{ title: string, contract?: { company_id: number } | null }>
type DeleteFunc = (id: number, portal_id: number) => Promise<{ title: string, contract?: { company_id: number } | null }>

/**
 * Синхронизация товаров договора Bitrix → БД (см. CONTEXT.md → contract product sync).
 *
 * Сам тянет productRows договора, по parentId резолвит тип каждого товара и приводит БД
 * в соответствие:
 *  - mode 'create'    — вставляет все (productFuncCreateRecord), пишет snapshot;
 *  - mode 'reconcile' — диф против прошлого snapshot: upsert наличных + удаление пропавших.
 *
 * Изоляция ошибок по товару (один битый товар не срывает остальные). Аудит — только если
 * передан userId (backfill при первом синке молчит, см. CONTEXT.md → events).
 *
 * Обвязка (резолв портала/токена, лок по договору, сам договор и company-fallback) —
 * на вызывающем. Этот модуль занимается только товарами.
 */
export async function reconcileContractProducts(args: ReconcileArgs): Promise<ReconcileSummary> {
  const { domain, token, contractBitrixId, contractStringId, portalId, mode, userId } = args
  const summary: ReconcileSummary = { created: 0, updated: 0, deleted: 0, skipped: 0 }

  const rows = (await bitrixAPI.getProductRowContract(domain, token, contractBitrixId.toString(), contractStringId)).result.productRows
  const products: ResolvedProduct[] = await Promise.all(rows.map(async (p) => {
    const info = await bitrixAPI.getProductInfo(domain, token, p.productId)
    info.result.product.productName = p.productName
    const parent = info.result.product.parentId ? Number(info.result.product.parentId.value) : info.result.product.id
    return { productRows: p, product: info.result.product, productType: productByParentId[parent] }
  }))

  const curr: SnapshotRow[] = products
    .filter(p => p.productType)
    .map(p => ({ bitrix_id: p.productRows.id, portal_id: portalId, type: p.productType! }))

  let deleted: SnapshotRow[] = []
  if (mode === 'reconcile') {
    const prev = await getShapshotProduct(contractBitrixId, portalId)
    const currIds = new Set(curr.map(r => r.bitrix_id))
    deleted = prev.filter(r => !currIds.has(r.bitrix_id))
  }

  const applyRecord = mode === 'create' ? productFuncCreateRecord : productFuncUpsertRecord
  await Promise.all(products.map(async (p) => {
    try {
      const key = p.productType
      if (!key) {
        console.warn(`[reconcile] не удалось определить тип товара по parentId для productId=${p.productRows.productId}`)
        summary.skipped++
        return
      }
      const row = await (applyRecord[key] as ProductFunc)({ info: p.product, productRows: p.productRows }, portalId)
      if (mode === 'create') summary.created++
      else summary.updated++
      if (userId !== undefined) {
        eventsAudit.emit(mode === 'create' ? 'entity.create' : 'entity.update', {
          userid: userId,
          entity: ProductToEntityRecord[key],
          entityName: row.title,
          companyid: row.contract?.company_id
        } as EventEntity)
      }
    } catch (e) {
      console.error('[reconcile] ошибка обработки товара', e)
    }
  }))


  await Promise.all(deleted.map(async (d) => {
    try {
      const row = await (productFuncDeleteRecord[d.type as ProductEnum] as DeleteFunc)(d.bitrix_id, d.portal_id)
      summary.deleted++
      if (userId !== undefined) {
        eventsAudit.emit('entity.delete', {
          userid: userId,
          entity: ProductToEntityRecord[d.type as ProductEnum],
          entityName: row.title,
          companyid: row.contract?.company_id
        } as EventEntity)
      }
    } catch (e) {
      console.error('[reconcile] ошибка удаления товара', e)
    }
  }))

  await saveShapshotProduct(contractBitrixId, portalId, curr)

  return summary
}
