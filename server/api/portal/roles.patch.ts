import * as z from 'zod'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { setUserRolePrisma } from '~~/server/utils/prisma/UserRole'
import { requireRole } from '~~/server/utils/requireRole'
import { UserRolePatch, type IUserRolePatch } from '~~/shared/models/APIModels'

// Назначение/снятие роли «менеджер» пользователю портала. 'admin' сюда не
// назначается — вычисляется из Bitrix, попытка передать его отклонит Zod-схема
// ещё до похода в БД (см. ADR-0007).
export default defineEventHandler(async (event): Promise<IUserRolePatch> => {
  requireRole(event, 'admin')
  const portal = event.context.portal as PortalDataType
  try {
    const body = await UserRolePatch.parseAsync(await readBody(event))
    const role = await setUserRolePrisma(portal.portal.id, body.user_bitrix_id, body.role)
    return { user_bitrix_id: body.user_bitrix_id, role }
  } catch (e) {
    console.error(e)
    if (e instanceof z.ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: mess })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
