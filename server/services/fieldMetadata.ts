import bitrixAPI from './bitrix/bitrixAPI'
import { prisma } from './prisma/prismaClient'
import type { IFieldMeta } from '~~/shared/models/APIModels'

// Типы полей Bitrix, которые виджет умеет рендерить и редактировать.
// Поля прочих типов для виджета не существуют (см. CONTEXT.md → field metadata),
// но в field_values они всё равно сохраняются — зеркало хранит ответ Bitrix целиком.
export const PRIMITIVE_FIELD_TYPES = ['string', 'integer', 'double', 'boolean', 'date', 'datetime', 'enumeration', 'money', 'url']

// Описание поля, как его отдаёт crm.item.fields
export interface IBitrixFieldMeta {
  type: string
  isRequired: boolean
  isReadOnly: boolean
  isImmutable: boolean
  isMultiple: boolean
  isDynamic: boolean
  title: string
  upperName?: string
  settings?: Record<string, unknown> | null
  items?: { ID: number | string, VALUE: string }[]
}

export type BitrixFieldsMap = Record<string, IBitrixFieldMeta>

// Элемент смарт-процесса, как его возвращает crm.item.* — системные ключи + динамика
export type BitrixItem = {
  id: number
  title: string
  companyId?: number | null
  mycompanyId?: number | null
} & Record<string, unknown>

export type MetadataEntity = 'contract' | 'module'

const MIRROR_TTL_MS = 10 * 60 * 1000

/**
 * Зеркало метаданных полей (ADR-0003): читает из БД, при устаревании (TTL) или force —
 * перечитывает crm.item.fields и сохраняет. Если Bitrix недоступен, работает по
 * устаревшему зеркалу: устаревание — не авария, а задержка UI.
 */
export async function getFieldsMirror(data: { portal_id: number, entity: MetadataEntity, domain: string, token: string, entityTypeId: number, force?: boolean }): Promise<BitrixFieldsMap> {
  const row = await prisma.field_metadata.findUnique({
    where: { portal_id_entity: { portal_id: data.portal_id, entity: data.entity } }
  })
  const fresh = row && (Date.now() - row.updated_at.getTime()) < MIRROR_TTL_MS
  if (row && fresh && !data.force) return row.fields as unknown as BitrixFieldsMap
  try {
    const response = await bitrixAPI.getItemFields(data.domain, data.token, data.entityTypeId)
    const fields = response.result.fields
    await prisma.field_metadata.upsert({
      where: { portal_id_entity: { portal_id: data.portal_id, entity: data.entity } },
      update: { fields: fields as object, updated_at: new Date() },
      create: { portal_id: data.portal_id, entity: data.entity, fields: fields as object }
    })
    return fields
  } catch (e) {
    if (row) {
      console.warn(`[fieldMetadata] не удалось обновить зеркало ${data.entity} портала ${data.portal_id}, работаем по устаревшему`, e)
      return row.fields as unknown as BitrixFieldsMap
    }
    throw e
  }
}

/** Инвалидация зеркала: следующий getFieldsMirror перечитает из Bitrix. */
export async function invalidateFieldsMirror(portal_id: number, entity: MetadataEntity) {
  await prisma.field_metadata.updateMany({
    where: { portal_id: portal_id, entity: entity },
    data: { updated_at: new Date(0) }
  })
}

/**
 * Косвенный сигнал устаревания зеркала: в элементе из Bitrix есть UF-ключ,
 * которого зеркало не знает (поле создали позже последнего обновления).
 */
export function hasUnknownDynamicFields(fields: BitrixFieldsMap, item: Record<string, unknown>): boolean {
  return Object.keys(item).some(k => k.startsWith('ufCrm') && !(k in fields))
}

/**
 * Реактивная инвалидация (вопрос C из ADR-0003): элемент из Bitrix содержит поле,
 * которого зеркало не знает → зеркало устарело, пометить к перечитыванию.
 * Bitrix при этом не дёргается — перечитает следующий getFieldsMirror.
 */
export async function detectMirrorStaleness(portal_id: number, entity: MetadataEntity, item: Record<string, unknown>) {
  const row = await prisma.field_metadata.findUnique({
    where: { portal_id_entity: { portal_id: portal_id, entity: entity } }
  })
  if (row && hasUnknownDynamicFields(row.fields as unknown as BitrixFieldsMap, item)) {
    console.log(`[fieldMetadata] незнакомое поле в элементе — инвалидируем зеркало ${entity} портала ${portal_id}`)
    await invalidateFieldsMirror(portal_id, entity)
  }
}

/** Поля, которые виджет рендерит и редактирует: динамические, изменяемые, примитивных типов. */
export function toClientFields(fields: BitrixFieldsMap): IFieldMeta[] {
  return Object.entries(fields)
    .filter(([code, f]) => code.startsWith('ufCrm') && f.isDynamic && !f.isReadOnly && PRIMITIVE_FIELD_TYPES.includes(f.type))
    .map(([code, f]) => {
      const meta: IFieldMeta = {
        code: code,
        title: f.title,
        type: f.type,
        isRequired: f.isRequired,
        isMultiple: f.isMultiple
      }
      if (f.items) meta.items = f.items.map(i => ({ id: String(i.ID), value: i.VALUE }))
      // Дефолт для дат Bitrix присылает объектом {TYPE, VALUE} — разворачиваем;
      // пустые дефолты ('' / null) не отдаём вовсе
      let def: unknown = f.settings?.DEFAULT_VALUE
      if (typeof def === 'object' && def !== null && 'VALUE' in def) def = (def as { VALUE: unknown }).VALUE
      if (def !== undefined && def !== null && def !== '') meta.default = def
      return meta
    })
}

/**
 * Тонкая валидация значений против зеркала (см. ADR-0003/0005: финальный судья — Bitrix):
 * неизвестные ключи молча отбрасываются (защита от форм по устаревшим метаданным),
 * required и грубая типизация проверяются для внятной ошибки пользователю.
 * Возвращает payload только из известных редактируемых полей.
 */
export function buildValuesPayload(fields: BitrixFieldsMap, values: Record<string, unknown>, options?: { partial?: boolean }): { payload: Record<string, unknown>, errors: string[] } {
  const payload: Record<string, unknown> = {}
  const errors: string[] = []
  for (const field of toClientFields(fields)) {
    const has = field.code in values
    const raw = values[field.code]
    const empty = raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)
    if (empty) {
      // При частичном обновлении непереданное поле не трогаем; переданное пустым — очищаем
      if (field.isRequired && (!options?.partial || has)) errors.push(`«${field.title}» — обязательное поле`)
      else if (has) payload[field.code] = field.isMultiple ? [] : null
      continue
    }
    const items = field.isMultiple ? (Array.isArray(raw) ? raw : [raw]) : [raw]
    const coerced: unknown[] = []
    for (const v of items) {
      switch (field.type) {
        case 'integer' : {
          const n = Number(v)
          if (!Number.isInteger(n)) { errors.push(`«${field.title}» — должно быть целым числом`); continue }
          coerced.push(n)
          break
        }
        case 'double' : {
          const n = Number(v)
          if (Number.isNaN(n)) { errors.push(`«${field.title}» — должно быть числом`); continue }
          coerced.push(n)
          break
        }
        case 'boolean' :
          coerced.push(v === true || v === 'true' || v === 'Y' || v === 1 || v === '1')
          break
        case 'enumeration' : {
          const id = String(v)
          if (field.items && !field.items.some(i => i.id === id)) { errors.push(`«${field.title}» — значение не из списка`); continue }
          coerced.push(Number(id))
          break
        }
        default :
          coerced.push(String(v))
      }
    }
    payload[field.code] = field.isMultiple ? coerced : coerced[0]
  }
  return { payload, errors }
}
