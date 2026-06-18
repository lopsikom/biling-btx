import type { ZodType } from 'zod'
import type { ProductEnum } from '~~/shared/models/bitrixModels'
import type { entityType } from '~~/shared/models/APIModels'

/**
 * Рецепт провижининга одного вида модуля.
 *
 * Сам сценарий добавления (лок → Bitrix → БД → snapshot → audit → unlock) живёт
 * в provisionModule и одинаков для всех. Здесь — только то, чем виды модулей
 * отличаются. См. CONTEXT.md → "module provisioning".
 *
 * Дженерики:
 *  - TBody    — распарсенное тело запроса (z.infer<схемы>)
 *  - TPrisma  — *CreateInput соответствующей таблицы (что принимает post)
 *  - TEntity  — что возвращает post (созданная строка)
 *  - TExtra   — результат afterPersist (M:N-данные), либо void
 */
export interface ModuleSpec<TBody, TPrisma, TEntity, TExtra = void> {
  /** Zod-схема тела запроса. Парсится в HTTP-слое (defineModuleHandler). */
  zodSchema: ZodType<TBody>

  /** Маппер тела в *CreateInput. Поля bitrix_id/product_id/portal дописывает движок. */
  mapToPrisma: (body: TBody) => TPrisma

  /** Тип продукта Bitrix. Константа для большинства, вычисление для autoinformation. */
  resolveProductType: (body: TBody) => ProductEnum

  /** Доп. свойства каталожного товара Bitrix. Опционально (у vats их нет). */
  buildCatalogProps?: (body: TBody) => Record<string, unknown> | undefined

  /** Запись основной строки модуля в БД. */
  post: (data: TPrisma) => Promise<TEntity>

  /** Опциональный пост-шаг: запись M:N (messengers/integrations) после основного post. */
  afterPersist?: (entity: TEntity, body: TBody) => Promise<TExtra>

  /** Сборка ответа. По умолчанию возвращается сама entity. */
  buildResponse?: (entity: TEntity, extra: TExtra) => unknown

  /** entityType для аудит-лога. */
  entityType: entityType
}

/** Поля строки модуля, нужные движку для snapshot/audit (есть у всех таблиц модулей). */
export interface ProvisionedEntity {
  title: string
  contract?: { company_id: number } | null
}
