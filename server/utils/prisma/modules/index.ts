import { prisma } from '~~/server/services/prisma/prismaClient'

export * from './Contract'
export * from './Module'

/**
 * Модули договора для snapshot (см. CONTEXT.md → snapshot). После коллапса пяти таблиц
 * в `module` (ADR-0004) — единый запрос. type = parent_product_id (вид модуля).
 */
export async function getAllModulesContact(id: number, portal_id: number): Promise<{ id: number, bitrix_id: number, portal_id: number, type: string }[]>
export async function getAllModulesContact(id: number): Promise<{ id: number, bitrix_id: number, portal_id: number, type: string }[]>
export async function getAllModulesContact(id: number, portal_id?: number): Promise<{ id: number, bitrix_id: number, portal_id: number, type: string }[]> {
  const modules = await prisma.module.findMany({
    where: portal_id ? { bitrix_id: id, portal_id } : { id },
    select: { id: true, bitrix_id: true, portal_id: true, parent_product_id: true }
  })
  return modules.map(m => ({ id: m.id, bitrix_id: m.bitrix_id, portal_id: m.portal_id, type: String(m.parent_product_id) }))
}
