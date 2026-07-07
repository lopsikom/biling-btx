import type { moduleCreateInput, moduleFindManyArgs } from '~~/server/services/models/generated/prisma/models'
import { prisma } from '~~/server/services/prisma/prismaClient'
import type { IModule, IModuleFilter } from '~~/shared/models/APIModels'

// Строка productRow договора + сведения об offer'е (для upsert из Bitrix)
export interface BitrixModuleSource {
  bitrix_id: number // id product row
  product_id: number | null // id offer'а в каталоге
  parent_product_id: number // вид (parentId offer'а)
  contract_bitrix_id: number | null
  title: string
  price: number
  quantity: number
  active: boolean
  field_values: Record<string, unknown>
}

function buildModuleWhere(portal_id: number, filter?: IModuleFilter): moduleFindManyArgs['where'] {
  const where: moduleFindManyArgs['where'] = { portal_id: portal_id }
  if (filter?.contract_id) where.contract_id = filter.contract_id
  if (filter?.parent_product_id) where.parent_product_id = filter.parent_product_id
  if (filter?.active !== undefined) where.active = filter.active
  // Фильтр по компании договора (bitrix_id компании)
  if (filter?.company_bitrix_id) {
    where.contract = { company: { bitrix_id: filter.company_bitrix_id, portal_id: portal_id } }
  }
  return where
}

export async function getModuleList(portal_id: number, filter?: IModuleFilter) {
  return prisma.module.findMany({ where: buildModuleWhere(portal_id, filter), orderBy: { id: 'desc' } })
}

export async function getModuleById(id: number, portal_id?: number) {
  return prisma.module.findFirst({
    where: portal_id ? { id, portal_id } : { id },
    include: { contract: { select: { id: true, bitrix_id: true, company_id: true, company: { select: { bitrix_id: true } } } } }
  })
}

export async function requireModule(id: number, portal_id: number) {
  return !!(await prisma.module.findFirst({ where: { id, portal_id } }))
}

/**
 * Единственный путь записи модуля в БД: replace-зеркало ответа Bitrix (ADR-0005).
 * field_values перезаписывается свойствами offer'а целиком, системные поля — из product row.
 * Компания/договор должны существовать в БД (caller обеспечивает).
 */
export async function upsertModuleFromBitrix(portal_id: number, src: BitrixModuleSource) {
  const data: moduleCreateInput = {
    bitrix_id: src.bitrix_id,
    product_id: src.product_id,
    parent_product_id: src.parent_product_id,
    title: src.title,
    price: src.price,
    quantity: src.quantity,
    active: src.active,
    field_values: src.field_values as object,
    portal: { connect: { id: portal_id } }
  }
  if (src.contract_bitrix_id) {
    data.contract = { connect: { portal_id_bitrix_id: { bitrix_id: src.contract_bitrix_id, portal_id } } }
  }
  return prisma.module.upsert({
    where: { portal_id_bitrix_id: { bitrix_id: src.bitrix_id, portal_id } },
    update: data,
    create: data,
    include: { contract: { select: { company_id: true } } }
  })
}

export async function deleteModuleByBitrixId(bitrix_id: number, portal_id: number) {
  return prisma.module.delete({ where: { portal_id_bitrix_id: { bitrix_id, portal_id } } })
}

/** Модули договора для snapshot-дифа (по bitrix_id договора). */
export async function getContractModules(contractBitrixId: number, portal_id: number) {
  return prisma.module.findMany({
    where: { portal_id, contract: { bitrix_id: contractBitrixId } },
    select: { id: true, bitrix_id: true, portal_id: true, parent_product_id: true }
  })
}

export type modulePrismaGet = Awaited<ReturnType<typeof upsertModuleFromBitrix>>

export function moduleToApi(data: { id: number, bitrix_id: number, product_id: number | null, parent_product_id: number, contract_id: number | null, title: string, price: number, quantity: number, active: boolean, field_values: unknown }): IModule {
  return {
    id: data.id,
    bitrix_id: data.bitrix_id,
    product_id: data.product_id,
    parent_product_id: data.parent_product_id,
    contract_id: data.contract_id,
    title: data.title,
    price: data.price,
    quantity: data.quantity,
    active: data.active,
    values: (data.field_values ?? {}) as Record<string, unknown>
  }
}
