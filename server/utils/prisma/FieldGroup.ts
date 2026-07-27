import { prisma } from '~~/server/services/prisma/prismaClient'
import type { IFieldGroup, FieldGroupsByKind } from '~~/shared/models/APIModels'

// Data-слой мультиселект-групп полей модулей (см. миграция 0003).
// Группа привязана к порталу (мультитенантность) и виду (parent_product_id).

/** Все группы портала, сгруппированные по виду — для метадаты каталога. */
export async function getFieldGroupsByKind(portal_id: number): Promise<FieldGroupsByKind> {
  const rows = await prisma.field_group.findMany({
    where: { portal_id },
    select: { parent_product_id: true, name: true, fields: true }
  })
  const byKind: FieldGroupsByKind = {}
  for (const r of rows) {
    (byKind[r.parent_product_id] ??= []).push({ name: r.name, fields: r.fields })
  }
  return byKind
}

/** Группы одного вида. */
export async function getFieldGroupsForKind(portal_id: number, parent_product_id: number): Promise<IFieldGroup[]> {
  const rows = await prisma.field_group.findMany({
    where: { portal_id, parent_product_id },
    select: { name: true, fields: true }
  })
  return rows.map(r => ({ name: r.name, fields: r.fields }))
}

/**
 * Replace-запись групп вида: удаляем старые группы этого вида и вставляем переданные.
 * Пустой массив групп → просто очистка (все поля вида снова рендерятся по отдельности).
 */
export async function replaceFieldGroupsForKind(portal_id: number, parent_product_id: number, groups: IFieldGroup[]) {
  await prisma.$transaction([
    prisma.field_group.deleteMany({ where: { portal_id, parent_product_id } }),
    ...(groups.length
      ? [prisma.field_group.createMany({
          data: groups.map(g => ({ portal_id, parent_product_id, name: g.name, fields: g.fields }))
        })]
      : [])
  ])
  return getFieldGroupsForKind(portal_id, parent_product_id)
}
