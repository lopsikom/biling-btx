import bitrixAPI from './bitrix/bitrixAPI'
import { prisma } from './prisma/prismaClient'
import type { IFieldMeta } from '~~/shared/models/APIModels'

// iblock offer'ов каталога — стабильная константа Bitrix (SKU-каталог товаров iblock 15).
// В отличие от списка видов, бизнес его не меняет, поэтому не выносится в привязку.
export const OFFER_IBLOCK_ID = 16
export const PRODUCT_IBLOCK_ID = 15

// Bitrix propertyType → тип поля в терминах виджета (как у field metadata договора).
// L = список (enumeration), N = число, S = строка. Прочие типы виджет не рендерит.
const CATALOG_TYPE_MAP: Record<string, string> = {
  S: 'string',
  N: 'double',
  L: 'enumeration'
}

export interface IBitrixCatalogProperty {
  id: number
  name: string
  code: string
  propertyType: string
}

// Ключ свойства offer'а в ответе Bitrix — property<id> (НЕ code). code — только для справки.
function offerKey(prop: IBitrixCatalogProperty): string {
  return `property${prop.id}`
}

// Значение свойства offer'а: список приходит объектом {value, valueEnum}, прочее — скаляром
type OfferPropValue = { value: string, valueEnum?: string, valueId?: string } | string | null

// Зеркало метаданных каталога: описания свойств + образцы полей по видам
export interface ICatalogMirror {
  // Все свойства offer'ов каталога (описания)
  properties: IBitrixCatalogProperty[]
  // Для каждого вида (parentId) — какие свойства релевантны (непустые у образца)
  fieldsByProduct: Record<number, string[]>
  // Имена видов (parentId → название товара)
  productNames: Record<number, string>
}

const MIRROR_TTL_MS = 10 * 60 * 1000

/**
 * Зеркало метаданных каталога (ADR-0006). Аналог field metadata договора, но источник —
 * каталог: описания свойств offer'ов (catalog.productProperty.list) + эвристика
 * релевантности «свойство принадлежит виду, если у образцового offer'а оно непусто».
 * Хранится в field_metadata с entity='module'.
 */
export async function getCatalogMirror(data: { portal_id: number, domain: string, token: string, productIds: number[], force?: boolean }): Promise<ICatalogMirror> {
  const row = await prisma.field_metadata.findUnique({
    where: { portal_id_entity: { portal_id: data.portal_id, entity: 'module' } }
  })
  const fresh = row && (Date.now() - row.updated_at.getTime()) < MIRROR_TTL_MS
  if (row && fresh && !data.force) return row.fields as unknown as ICatalogMirror
  try {
    const propsResp = await bitrixAPI.getCatalogProperties(data.domain, data.token, OFFER_IBLOCK_ID)
    const properties = propsResp.result.productProperties.filter(p => p.propertyType in CATALOG_TYPE_MAP)
    // Ключи для select и для чтения значений — property<id> (Bitrix отдаёт по ним, не по code)
    const propKeys = properties.map(offerKey)

    const fieldsByProduct: Record<number, string[]> = {}
    const productNames: Record<number, string> = {}

    // Имена видов
    if (data.productIds.length) {
      const products = await bitrixAPI.getCatalogProducts(data.domain, data.token, PRODUCT_IBLOCK_ID, data.productIds)
      for (const p of products.result.products) productNames[p.id] = p.name
    }

    // Релевантность полей: по образцовому offer'у каждого вида (свойство релевантно, если непусто)
    for (const parentId of data.productIds) {
      const offers = await bitrixAPI.getCatalogOffers(data.domain, data.token, OFFER_IBLOCK_ID, parentId, propKeys)
      const sample = offers.result.offers[0]
      if (!sample) {
        fieldsByProduct[parentId] = []
        continue
      }
      fieldsByProduct[parentId] = propKeys.filter(key => !isEmptyOfferValue(sample[key] as OfferPropValue))
    }

    const mirror: ICatalogMirror = { properties, fieldsByProduct, productNames }
    await prisma.field_metadata.upsert({
      where: { portal_id_entity: { portal_id: data.portal_id, entity: 'module' } },
      update: { fields: mirror as unknown as object, updated_at: new Date() },
      create: { portal_id: data.portal_id, entity: 'module', fields: mirror as unknown as object }
    })
    return mirror
  } catch (e) {
    if (row) {
      console.warn(`[catalogMetadata] не удалось обновить зеркало каталога портала ${data.portal_id}, работаем по устаревшему`, e)
      return row.fields as unknown as ICatalogMirror
    }
    throw e
  }
}

function isEmptyOfferValue(v: OfferPropValue): boolean {
  if (v === null || v === undefined || v === '') return true
  if (typeof v === 'object') return v.value === null || v.value === undefined || v.value === '' || v.value === 'N'
  return v === 'N'
}

/** Инвалидация зеркала каталога: следующий getCatalogMirror перечитает из Bitrix. */
export async function invalidateCatalogMirror(portal_id: number) {
  await prisma.field_metadata.updateMany({
    where: { portal_id, entity: 'module' },
    data: { updated_at: new Date(0) }
  })
}

/**
 * Косвенный сигнал устаревания (ADR-0003): в товаре из Bitrix встретился вид (parentId),
 * которого зеркало не знает → пометить к перечитыванию. Bitrix не дёргается.
 */
export async function detectCatalogMirrorStaleness(portal_id: number, product: Record<string, unknown>) {
  const row = await prisma.field_metadata.findUnique({
    where: { portal_id_entity: { portal_id, entity: 'module' } }
  })
  if (!row) return
  const mirror = row.fields as unknown as ICatalogMirror
  const parent = product.parentId ? Number((product.parentId as { value: string }).value) : Number(product.id)
  if (parent && !(parent in (mirror.productNames ?? {}))) {
    console.log(`[catalogMetadata] незнакомый вид ${parent} — инвалидируем зеркало каталога портала ${portal_id}`)
    await invalidateCatalogMirror(portal_id)
  }
}

/**
 * Поля вида модуля для рендера формы — свойства, релевантные виду.
 * code поля = property<id> (ключ, по которому Bitrix читает/пишет значение),
 * title = человекочитаемое имя свойства.
 */
export function moduleFieldsForProduct(mirror: ICatalogMirror, parentProductId: number): IFieldMeta[] {
  const relevant = new Set(mirror.fieldsByProduct[parentProductId] ?? [])
  return mirror.properties
    .filter(p => relevant.has(offerKey(p)))
    .map(p => ({
      code: offerKey(p),
      title: p.name,
      type: CATALOG_TYPE_MAP[p.propertyType] ?? 'string',
      isRequired: false,
      isMultiple: false
    }))
}

export function catalogTypeMap() {
  return CATALOG_TYPE_MAP
}

/**
 * Значения формы модуля → payload свойств offer'а для Bitrix (тонкая валидация по зеркалу).
 * Неизвестные виду свойства отбрасываются (защита от устаревшей формы). Свойства-списки
 * Bitrix принимает как { value: <id|строка> }, прочее — скаляром.
 */
export function buildOfferPayload(mirror: ICatalogMirror, parentProductId: number, values: Record<string, unknown>): Record<string, unknown> {
  const fields = moduleFieldsForProduct(mirror, parentProductId)
  const payload: Record<string, unknown> = {}
  for (const field of fields) {
    if (!(field.code in values)) continue
    const raw = values[field.code]
    if (raw === undefined || raw === null || raw === '') continue
    if (field.type === 'enumeration') payload[field.code] = { value: raw }
    else if (field.type === 'double') payload[field.code] = Number(raw)
    else payload[field.code] = raw
  }
  return payload
}
