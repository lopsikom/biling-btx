import * as z from 'zod'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { setUserRolePrisma } from '~~/server/utils/prisma/UserRole'
import { requireRole } from '~~/server/utils/requireRole'
import { UserRolePatch, type IUserRolePatch } from '~~/shared/models/APIModels'

// Назначение/снятие роли пользователю портала — включая 'admin' как независимый
// от Bitrix грант виджета (ADR-0008): итоговая роль пользователя всё равно берёт
// максимум с вычисленным из Bitrix статусом (см. requirePortal.ts), так что этот
// грант не может кого-то *понизить* ниже реального админства Bitrix-портала.
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
