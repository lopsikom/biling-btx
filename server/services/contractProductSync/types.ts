import type { ProductEnum } from '~~/shared/models/bitrixModels'

/** Режим зеркалирования товаров договора. */
export type ReconcileMode = 'create' | 'reconcile'

/** Запись снимка модулей договора (см. CONTEXT.md → snapshot). */
export interface SnapshotRow {
  bitrix_id: number
  portal_id: number
  type: string
}

/** Вход reconcileContractProducts. Токен/домен добываются вызывающим (обвязка снаружи). */
export interface ReconcileArgs {
  domain: string
  token: string
  /** Числовой bitrix_id договора (ownerId для productrow.list, ключ snapshot). */
  contractBitrixId: number
  /** Строковый тип владельца договора в Bitrix (ownerType, напр. "T422"). */
  contractStringId: string
  portalId: number
  mode: ReconcileMode
  /**
   * Если задан — пишется аудит (create→entity.create, reconcile→update/delete).
   * Не задан → аудит молчит (backfill при первом синке, см. CONTEXT.md → events).
   */
  userId?: number
}

/** Сводка результата для наблюдаемости. Вызывающий волен игнорировать. */
export interface ReconcileSummary {
  created: number
  updated: number
  deleted: number
  skipped: number
}

/** Внутреннее представление одного товара договора после резолва типа. */
export interface ResolvedProduct {
  productRows: import('~~/shared/models/bitrixModels').IProductRow
  product: import('~~/shared/models/bitrixModels').AnyProduct
  productType: ProductEnum | undefined
}
