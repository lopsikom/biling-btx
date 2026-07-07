import bitrixAPI from '~~/server/services/bitrix/bitrixAPI'
import { eventsAudit, type EventEntity } from '~~/server/services/EventsAudit'
import { getShapshotProduct, saveShapshotProduct } from '~~/server/services/webHooksEvents'
import { upsertModuleFromBitrix, deleteModuleByBitrixId, type BitrixModuleSource } from '~~/server/utils/prisma/modules/Module'
import { detectCatalogMirrorStaleness } from '~~/server/services/catalogMetadata'
import { entityType } from '~~/shared/models/APIModels'
import type { ReconcileArgs, ReconcileSummary, SnapshotRow } from './types'

/**
 * Синхронизация товаров договора Bitrix → БД (см. CONTEXT.md → contract product sync).
 *
 * После коллапса пяти таблиц в `module` (ADR-0004): единый путь, без диспатча по видам.
 * Тянет productRows договора, по каждому берёт offer (вид = parentId, свойства → field_values),
 * upsert'ит в module (replace-зеркало, ADR-0005). Диф против snapshot удаляет пропавшие.
 *
 * Изоляция ошибок по товару. Аудит — только при переданном userId (backfill молчит).
 * Обвязка (портал/токен/лок/договор) — на вызывающем.
 */
export async function reconcileContractProducts(args: ReconcileArgs): Promise<ReconcileSummary> {
  const { domain, token, contractBitrixId, contractStringId, portalId, mode, userId } = args
  const summary: ReconcileSummary = { created: 0, updated: 0, deleted: 0, skipped: 0 }

  const rows = (await bitrixAPI.getProductRowContract(domain, token, contractBitrixId.toString(), contractStringId)).result.productRows

  const sources: (BitrixModuleSource & { seenProduct?: Record<string, unknown> })[] = []
  for (const row of rows) {
    try {
      const info = await bitrixAPI.getProductInfo(domain, token, row.productId)
      const product = info.result.product as unknown as Record<string, unknown>
      const parent = product.parentId ? Number((product.parentId as { value: string }).value) : Number(product.id)
      // Свойства offer'а → field_values (всё, что начинается с property* или имеет code-ключ)
      const values: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(product)) {
        if (k.startsWith('property')) values[k] = normalizeOfferValue(v)
      }
      sources.push({
        bitrix_id: row.id,
        product_id: row.productId,
        parent_product_id: parent,
        contract_bitrix_id: contractBitrixId,
        title: row.productName as unknown as string,
        price: row.price,
        quantity: row.quantity,
        active: true,
        field_values: values,
        seenProduct: product
      })
    } catch (e) {
      console.error(`[reconcile] ошибка получения offer'а productId=${row.productId}`, e)
      summary.skipped++
    }
  }

  // Косвенная инвалидация зеркала каталога (незнакомый вид) — по первому товару
  if (sources[0]?.seenProduct) await detectCatalogMirrorStaleness(portalId, sources[0].seenProduct)

  const curr: SnapshotRow[] = sources.map(s => ({ bitrix_id: s.bitrix_id, portal_id: portalId, type: String(s.parent_product_id) }))

  let deleted: SnapshotRow[] = []
  if (mode === 'reconcile') {
    const prev = await getShapshotProduct(contractBitrixId, portalId)
    const currIds = new Set(curr.map(r => r.bitrix_id))
    deleted = prev.filter(r => !currIds.has(r.bitrix_id))
  }

  await Promise.all(sources.map(async (s) => {
    try {
      const module = await upsertModuleFromBitrix(portalId, s)
      if (mode === 'create') summary.created++
      else summary.updated++
      if (userId !== undefined) {
        eventsAudit.emit(mode === 'create' ? 'entity.create' : 'entity.update', {
          userid: userId,
          entity: entityType.MODULE,
          entityName: module.title,
          companyid: module.contract?.company_id
        } as EventEntity)
      }
    } catch (e) {
      console.error('[reconcile] ошибка upsert модуля', e)
    }
  }))

  await Promise.all(deleted.map(async (d) => {
    try {
      const module = await deleteModuleByBitrixId(d.bitrix_id, d.portal_id)
      summary.deleted++
      if (userId !== undefined) {
        eventsAudit.emit('entity.delete', {
          userid: userId,
          entity: entityType.MODULE,
          entityName: module.title
        } as unknown as EventEntity)
      }
    } catch (e) {
      console.error('[reconcile] ошибка удаления модуля', e)
    }
  }))

  await saveShapshotProduct(contractBitrixId, portalId, curr)
  return summary
}

// Значение свойства offer'а: список приходит {value, valueEnum}, храним valueEnum (человекочитаемо)
function normalizeOfferValue(v: unknown): unknown {
  if (v && typeof v === 'object' && 'value' in v) {
    const o = v as { value: unknown, valueEnum?: unknown }
    return o.valueEnum ?? o.value
  }
  return v
}
