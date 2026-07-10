import { prisma } from '~~/server/services/prisma/prismaClient'

// Data-слой видимости полей модулей (field visibility, см. миграция 0005).
// Одна строка на (портал, вид): hidden_fields — replace-множество скрытых кодов.

/** Скрытые поля всех видов портала — для метадаты каталога. */
export async function getHiddenFieldsByKind(portal_id: number): Promise<Record<number, string[]>> {
  const rows = await prisma.field_visibility.findMany({
    where: { portal_id },
    select: { parent_product_id: true, hidden_fields: true }
  })
  const byKind: Record<number, string[]> = {}
  for (const r of rows) byKind[r.parent_product_id] = r.hidden_fields
  return byKind
}

/**
 * Replace-запись скрытых полей вида. Пустой массив → строка удаляется (вид снова
 * без скрытий, не храним пустые отклонения).
 */
export async function replaceHiddenFieldsForKind(portal_id: number, parent_product_id: number, hidden_fields: string[]): Promise<string[]> {
  if (hidden_fields.length === 0) {
    await prisma.field_visibility.deleteMany({ where: { portal_id, parent_product_id } })
    return []
  }
  const row = await prisma.field_visibility.upsert({
    where: { portal_id_parent_product_id: { portal_id, parent_product_id } },
    create: { portal_id, parent_product_id, hidden_fields },
    update: { hidden_fields }
  })
  return row.hidden_fields
}
