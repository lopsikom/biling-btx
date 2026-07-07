import type { contractFindManyArgs } from '~~/server/services/models/generated/prisma/models'
import { prisma } from '~~/server/services/prisma/prismaClient'
import type { IContract, IContractFilter } from '~~/shared/models/APIModels'
import type { BitrixItem } from '~~/server/services/fieldMetadata'

function buildContractWhere(portal_id: number | undefined, filter?: IContractFilter) {
  const where: contractFindManyArgs['where'] = {
    name: filter?.name
      ? {
          startsWith: filter.name,
          mode: 'insensitive'
        }
      : undefined,
    company_id: filter?.company_id,
    company: {
      portal_id: portal_id,
      bitrix_id: filter?.bitrxi_company_id
    }
  }
  // Фильтры по динамическим полям: ключ = код поля Bitrix, сравнение по значению в JSONB.
  // Строки — вхождением, остальное (id enumeration, числа, булевы) — равенством.
  if (filter?.values && Object.keys(filter.values).length) {
    where!.AND = Object.entries(filter.values).map(([code, value]) => ({
      field_values: typeof value === 'string'
        ? { path: [code], string_contains: value }
        : { path: [code], equals: value as never }
    }))
  }
  return where
}

export async function getContractList(data: { portal_id?: number, filter?: IContractFilter }): Promise<contractPrismaGet[]>
export async function getContractList(data: { portal_id?: number, filter?: IContractFilter }, pagination?: { after?: number, limit?: number }): Promise<contractPrismaWithPagination>
export async function getContractList(data: { portal_id?: number, filter?: IContractFilter }, pagination?: { after?: number, limit?: number }) {
  const { portal_id, filter } = data
  const args = {
    where: buildContractWhere(portal_id, filter),
    orderBy: {
      id: 'desc'
    }
  } as contractFindManyArgs
  if (pagination) {
    if (pagination.after) args.skip = pagination.after
    if (pagination.limit) args.take = pagination.limit
    const response = await prisma.$transaction([
      prisma.contract.findMany(args),
      prisma.contract.count({ where: args.where })
    ])
    const [list, count] = response
    return {
      data: list,
      count: count
    }
  } else {
    const response = await prisma.contract.findMany(args)
    return response
  }
}

export async function getContractById(id: number, portal_id?: number) {
  const response = await prisma.contract.findFirst({
    where: portal_id ? { portal_id: portal_id, bitrix_id: id } : { id: id },
    include: {
      company: { select: {
        id: true,
        title: true,
        bitrix_id: true
      } }
    }
  })
  return response
}

export async function deleteContractPrisma(id: number, portal_id?: number) {
  // Модули отвязываются автоматически: module.contract_id ON DELETE SET NULL (ADR-0004).
  return prisma.contract.delete({
    where: portal_id ? { portal_id_bitrix_id: { bitrix_id: id, portal_id: portal_id } } : { id: id }
  })
}

/**
 * Единственный путь записи договора в БД: replace-зеркало ответа Bitrix (ADR-0005).
 * field_values перезаписывается целиком элементом из Bitrix, системные поля
 * извлекаются из него же. Компания должна уже существовать в БД (caller обеспечивает).
 */
export async function upsertContractFromBitrix(portal_id: number, item: BitrixItem) {
  const data = {
    name: item.title,
    bitrix_id: item.id,
    field_values: item as object,
    portal: { connect: { id: portal_id } },
    company: { connect: { bitrix_id_portal_id: { bitrix_id: String(item.companyId), portal_id: portal_id } } }
  }
  const response = await prisma.contract.upsert({
    where: {
      portal_id_bitrix_id: {
        bitrix_id: item.id,
        portal_id: portal_id
      }
    },
    update: data,
    create: data
  })
  return response
}

export async function requireContract(id: number, portal_id: number) {
  const response = await prisma.contract.findFirst({ where: { id, portal_id } })
  return !!response
}

export function contractToApi(data: contractPrismaGet): IContract
export function contractToApi(data: contractPrismaGet[]): IContract[]
export function contractToApi(data: contractPrismaGet | contractPrismaGet[]): IContract | IContract[] {
  const map = (c: contractPrismaGet): IContract => ({
    id: c.id,
    bitrix_id: c.bitrix_id,
    name: c.name,
    company_id: c.company_id,
    values: (c.field_values ?? {}) as Record<string, unknown>
  })
  return Array.isArray(data) ? data.map(map) : map(data)
}

export type contractPrismaGet = Awaited<ReturnType<typeof upsertContractFromBitrix>>
export type contractPrismaWithPagination = {
  data: contractPrismaGet[]
  count: number
}
