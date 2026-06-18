import type { ZodType } from 'zod'
import type { ProductEnum } from '~~/shared/models/bitrixModels'
import type { entityType } from '~~/shared/models/APIModels'
import type companyClient from '~~/server/services/bitrix/CompanyClient'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'

/** Минимум полей старой строки модуля, нужный движку update. Есть у всех таблиц. */
export interface OldModuleRow {
  bitrix_id: number | null
  contract_id: number | null
  product_id: number | null
}

/**
 * Контекст, который движок update передаёт в обработчик Bitrix-части.
 * Через него spec, при желании, полностью берёт на себя работу с Bitrix
 * (нестандартные сценарии — напр. миграция категории продукта у autoinfo).
 */
export interface ProductUpdateContext<TBody> {
  company: companyClient
  body: TBody
  /** Старая строка модуля (с гарантированно ненулевыми bitrix_id/contract_id). */
  old: OldModuleRow & { bitrix_id: number, contract_id: number }
  ctx: PortalDataType
  /** bitrix_id договора, на котором сейчас висит модуль. */
  contractBitrixId: number
}

/**
 * Результат обработчика Bitrix-части. Движок применяет его к prismaData
 * перед записью в БД (так же, как стандартный путь дописывает bitrix_id).
 */
export interface ProductUpdateResult {
  bitrixIdOverride?: number
  productIdOverride?: number
  /** true → движок НЕ выполняет стандартный update/перенос (spec всё сделал сам). */
  dropContract?: boolean
}

/**
 * Рецепт обновления одного вида модуля (PATCH). Стандартный сценарий — update товара
 * + опциональный перенос между договорами — живёт в updateModule. Здесь только различия.
 *
 * handleProductUpdate — «побег» для модулей с нестандартной Bitrix-логикой
 * (autoinfo: миграция категории продукта). Если задан, движок отдаёт ему Bitrix-часть
 * целиком и не выполняет стандартный путь.
 */
export interface UpdateModuleSpec<TBody, TPrisma, TEntity> {
  updateSchema: ZodType<TBody>
  mapToPrisma: (body: TBody) => TPrisma
  /** Тип продукта Bitrix старого модуля (для switchContractProduct). */
  productType: (old: OldModuleRow, body: TBody) => ProductEnum
  /** Доп. свойства каталога при update. Опционально (vats не имеет). */
  buildCatalogProps?: (body: TBody) => Record<string, unknown> | undefined
  /** Проверка владения тенантом по id (require*). */
  requireOwn: (id: number, portalId: number) => Promise<boolean>
  /** Загрузка старой строки. */
  getOld: (id: number) => Promise<(OldModuleRow & Record<string, unknown>) | null>
  /** Запись обновления в БД. */
  patch: (id: number, data: TPrisma, body: TBody) => Promise<TEntity | null>
  /** Сборка ответа. По умолчанию — сама entity. */
  buildResponse?: (entity: TEntity) => unknown
  entityType: entityType
  /** Нестандартная Bitrix-логика. Если задан — стандартный путь не выполняется. */
  handleProductUpdate?: (args: ProductUpdateContext<TBody>) => Promise<ProductUpdateResult>
}
