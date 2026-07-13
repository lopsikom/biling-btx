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
  isMultiple?: boolean
  isRequired?: boolean
}

// Ответ catalog.product.offer.getFieldsByFilter: ключ = property<id> или системное поле.
export interface IOfferFieldMeta {
  name: string
  propertyType?: string
  isMultiple?: boolean
  isRequired?: boolean
  isDynamic?: boolean
  type?: string
}
export type OfferFieldsMap = Record<string, IOfferFieldMeta>

// Вариант списочного (L) свойства: id — то, что лежит в offer'е, value — человекочитаемое
export interface ICatalogPropertyEnum {
  id: string
  value: string
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
  // Варианты списочных свойств: propertyId → [{ id, value }] (для items у селекторов)
  enumsByProperty?: Record<number, ICatalogPropertyEnum[]>
  // Категория вида = папка-подраздел корня (parentId → id категории). Для группировки видов.
  categoryByProduct?: Record<number, number>
  // Имена категорий (id подпапки корня → название, напр. «ВАТС»)
  categoryNames?: Record<number, string>
}

const MIRROR_TTL_MS = 10 * 60 * 1000

/**
 * Зеркало метаданных каталога (ADR-0006). Аналог field metadata договора, но источник —
 * каталог: виды = все товары под корневым разделом rootSectionId (его поддерево) +
 * штатные поля offer'ов (catalog.product.offer.getFieldsByFilter, даёт
 * name/type/isMultiple/isRequired) + варианты списков (productPropertyEnum.list) +
 * эвристика релевантности «свойство принадлежит виду, если непусто хотя бы у одного
 * offer'а вида» (нативной привязки свойство↔вид в каталоге нет). entity='module'.
 */
export async function getCatalogMirror(data: { portal_id: number, domain: string, token: string, rootSectionId: number, force?: boolean }): Promise<ICatalogMirror> {
  const row = await prisma.field_metadata.findUnique({
    where: { portal_id_entity: { portal_id: data.portal_id, entity: 'module' } }
  })
  const fresh = row && (Date.now() - row.updated_at.getTime()) < MIRROR_TTL_MS
  if (row && fresh && !data.force) return row.fields as unknown as ICatalogMirror
  try {
    // Метаданные полей offer'а штатным методом (name/propertyType/isMultiple/isRequired) —
    // как crm.item.fields. Берём только динамические property* примитивных типов.
    const offerFields = await bitrixAPI.getOfferFields(data.domain, data.token, OFFER_IBLOCK_ID)
    const properties: IBitrixCatalogProperty[] = Object.entries(offerFields)
      .filter(([key, f]) => key.startsWith('property') && f.propertyType && f.propertyType in CATALOG_TYPE_MAP)
      .map(([key, f]) => ({
        id: Number(key.replace('property', '')),
        name: f.name,
        code: key,
        propertyType: f.propertyType as string,
        isMultiple: f.isMultiple,
        isRequired: f.isRequired
      }))
    // Ключи для select и для чтения значений — property<id> (Bitrix отдаёт по ним, не по code)
    const propKeys = properties.map(offerKey)

    // Варианты списочных (L) свойств — для items у полей-селекторов
    const enumPropIds = properties.filter(p => p.propertyType === 'L').map(p => p.id)
    const enumsByProperty: Record<number, ICatalogPropertyEnum[]> = {}
    if (enumPropIds.length) {
      const enumsResp = await bitrixAPI.getCatalogPropertyEnums(data.domain, data.token, enumPropIds)
      for (const e of enumsResp.result.productPropertyEnums) {
        (enumsByProperty[e.propertyId] ??= []).push({ id: String(e.id), value: e.value })
      }
    }

    const fieldsByProduct: Record<number, string[]> = {}
    const productNames: Record<number, string> = {}

    // Виды = все товары под корневым разделом каталога (его поддерево разделов).
    // Бизнес кладёт товар в папку «Нового каталога» — он автоматически становится видом.
    const sectionsResp = await bitrixAPI.getCatalogSections(data.domain, data.token, PRODUCT_IBLOCK_ID)
    const sections = sectionsResp.result.sections
    const sectionIds = collectSectionSubtree(sections, data.rootSectionId)
    const products = await bitrixAPI.getCatalogProductsBySection(data.domain, data.token, PRODUCT_IBLOCK_ID, sectionIds)
    const productIds = products.result.products.map(p => p.id)

    // Категории = прямые подпапки корня (напр. «ВАТС», «Чат-бот»). Каждый вид относится
    // к своей категории — по ней виды группируются в UI (как в старом окне модулей).
    const parentOf = new Map(sections.map(s => [s.id, s.iblockSectionId]))
    const categoryNames: Record<number, string> = {}
    for (const s of sections) if (s.iblockSectionId === data.rootSectionId) categoryNames[s.id] = s.name
    const categoryByProduct: Record<number, number> = {}
    for (const p of products.result.products) {
      productNames[p.id] = p.name
      // Поднимаемся от раздела товара до прямой подпапки корня — это его категория.
      let sec: number | null = p.iblockSectionId
      while (sec != null && parentOf.get(sec) !== data.rootSectionId) sec = parentOf.get(sec) ?? null
      if (sec != null) categoryByProduct[p.id] = sec
    }

    // Flag-поля (L с единственным вариантом «Да» → чекбокс Y/N): у offer'ов ВСЕХ видов
    // они заполнены N, поэтому «не-null» их не отсекает (мессенджеры лезут ко всем видам).
    // Для них релевантность строже: флаг принадлежит виду, только если хоть один offer'
    // имеет Y (вид реально его использует). Проверено на портале: Y есть только у Чат-бота.
    const flagKeys = new Set(properties.filter(p => p.propertyType === 'L' && (enumsByProperty[p.id]?.length ?? 0) === 1).map(offerKey))

    // Релевантность полей (ADR-0006): свойство принадлежит виду, если непусто хотя бы у одного
    // offer'а (null = неприменимо к SKU). Flag-поля — только если хоть у одного offer'а Y.
    // Сканируем все offer'ы вида, а не первый — образец бывает пустым черновиком.
    for (const parentId of productIds) {
      const offers = (await bitrixAPI.getCatalogOffers(data.domain, data.token, OFFER_IBLOCK_ID, parentId, propKeys)).result.offers
      fieldsByProduct[parentId] = propKeys.filter(key => flagKeys.has(key)
        ? offers.some(o => isOfferFlagOn(o[key] as OfferPropValue))
        : offers.some(o => !isEmptyOfferValue(o[key] as OfferPropValue)))
    }

    const mirror: ICatalogMirror = { properties, fieldsByProduct, productNames, enumsByProperty, categoryByProduct, categoryNames }
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

// Пусто = свойство неприменимо к offer'у (null/undefined/''). Для boolean-свойств
// 'N' — это ВАЛИДНОЕ значение «нет/false», а НЕ пустота: иначе любое выключенное
// boolean-поле пропадало бы из вида (у boolean не бывает значений кроме Y/N).
function isEmptyOfferValue(v: OfferPropValue): boolean {
  if (v === null || v === undefined || v === '') return true
  if (typeof v === 'object') return v.value === null || v.value === undefined || v.value === ''
  return false
}

// Flag-поле «включено» = значение 'Y' (offer хранит flag как Y/N-строку, объектом {value:'Y'}).
// По этому сигналу определяем, что вид реально использует флаг (см. релевантность в getCatalogMirror).
function isOfferFlagOn(v: OfferPropValue): boolean {
  if (typeof v === 'object' && v !== null) return v.value === 'Y'
  return v === 'Y'
}

// Раздел + все его подразделы (обход дерева вниз по parent-ссылкам).
// Возвращает id корня и всех потомков — товары в них становятся видами модулей.
export function collectSectionSubtree(sections: { id: number, iblockSectionId: number | null }[], rootId: number): number[] {
  const children = new Map<number, number[]>()
  for (const s of sections) {
    if (s.iblockSectionId != null) (children.get(s.iblockSectionId) ?? children.set(s.iblockSectionId, []).get(s.iblockSectionId)!).push(s.id)
  }
  const result: number[] = []
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()!
    result.push(id)
    for (const c of children.get(id) ?? []) stack.push(c)
  }
  return result
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
    .map((p) => {
      const enums = p.propertyType === 'L' ? (mirror.enumsByProperty?.[p.id] ?? []) : []
      // L-свойство с единственным вариантом («Да» / «-») в Bitrix — это чекбокс, а не
      // список: показываем как boolean, иначе получаем бессмысленный селектор из одного пункта.
      const isFlag = p.propertyType === 'L' && enums.length === 1
      const meta: IFieldMeta = {
        code: offerKey(p),
        title: p.name,
        type: isFlag ? 'boolean' : (CATALOG_TYPE_MAP[p.propertyType] ?? 'string'),
        // isRequired/isMultiple — из штатных метаданных offer'а (getFieldsByFilter).
        // Flag-поле (boolean-чекбокс) по определению не множественное.
        isRequired: !!p.isRequired,
        isMultiple: !isFlag && !!p.isMultiple
      }
      // Настоящему списку (>1 варианта) прокидываем варианты — иначе селектор пуст
      if (p.propertyType === 'L' && !isFlag) meta.items = enums
      // У flag-поля запоминаем id варианта «Да» — для записи значения в Bitrix
      if (isFlag) meta.trueEnumId = enums[0]?.id
      return meta
    })
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
    // Flag-поле (L с одним вариантом «Да»): Bitrix хранит и ждёт его как голую строку
    // 'Y'/'N' (проверено catalog.product.get), а НЕ как { value: <id> } — иначе не применяется.
    if (field.trueEnumId) {
      const on = raw === true || raw === 'Y' || raw === 1 || raw === '1' || String(raw) === field.trueEnumId
      payload[field.code] = on ? 'Y' : 'N'
      continue
    }
    if (raw === undefined || raw === null || raw === '') continue
    if (field.type === 'enumeration') payload[field.code] = { value: raw }
    else if (field.type === 'double') payload[field.code] = Number(raw)
    else payload[field.code] = raw
  }
  return payload
}
