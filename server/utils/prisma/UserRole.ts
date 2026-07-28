import { prisma } from '~~/server/services/prisma/prismaClient'
import type { AssignableRole } from '~~/shared/models/APIModels'

// «Наблюдатель» — отсутствие строки в user_role, а не значение. «Админ» тоже
// может быть здесь записан как явный грант (ADR-0008) — это независимый от
// Bitrix путь получить админку виджета, финальная роль берёт максимум
// из гранта и вычисленного из Bitrix статуса (см. requirePortal.ts).
export async function getUserRolePrisma(portal_id: number, user_bitrix_id: number): Promise<AssignableRole> {
  const grant = await prisma.user_role.findUnique({
    where: { portal_id_user_bitrix_id: { portal_id, user_bitrix_id } },
    include: { role: true }
  })
  return (grant?.role.name as AssignableRole | undefined) ?? 'viewer'
}

export async function listPortalUserRolesPrisma(portal_id: number) {
  const users = await prisma.user_bitrix.findMany({
    where: { portal_id },
    select: {
      id: true,
      bitrix_id: true,
      name: true,
      last_name: true,
      second_name: true,
      user_role: { select: { role: { select: { name: true } } } }
    }
  })
  // user_bitrix.user_role — массив со стороны Prisma (FK не composite-unique
  // на этой стороне), но по бизнес-инварианту (portal_id, user_bitrix_id) уникальна:
  // строка ровно одна или её нет.
  return users.map(({ user_role, ...u }) => ({
    ...u,
    last_name: u.last_name ?? '',
    second_name: u.second_name ?? '',
    role: (user_role[0]?.role.name as AssignableRole | undefined) ?? 'viewer'
  }))
}

export async function setUserRolePrisma(portal_id: number, user_bitrix_id: number, role: AssignableRole) {
  // user_role.user_bitrix_id — FK на user_bitrix.id глобально, без композитного
  // ограничения на portal_id: без явной проверки админ портала A мог бы назначить
  // роль user_bitrix_id, принадлежащему порталу B.
  const user = await prisma.user_bitrix.findUnique({ where: { id: user_bitrix_id } })
  if (!user || user.portal_id !== portal_id) {
    throw createError({ statusCode: 404, statusMessage: 'User not found on this portal' })
  }

  if (role === 'viewer') {
    await prisma.user_role.deleteMany({ where: { portal_id, user_bitrix_id } })
    return role
  }

  const roleRow = await prisma.role.findUnique({ where: { name: role } })
  if (!roleRow) throw createError({ statusCode: 400, statusMessage: `Unknown role: ${role}` })

  await prisma.user_role.upsert({
    where: { portal_id_user_bitrix_id: { portal_id, user_bitrix_id } },
    update: { role_id: roleRow.id },
    create: { portal_id, user_bitrix_id, role_id: roleRow.id }
  })
  return role
}
