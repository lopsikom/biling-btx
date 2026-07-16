import { ZodError } from 'zod'
import { provisionModule } from '~~/server/services/moduleProvisioning'
import { moduleToApi } from '~~/server/utils/prisma/modules/Module'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { requireRole } from '~~/server/utils/requireRole'
import { ModulePost } from '~~/shared/models/APIModels'

// Создание модуля: Bitrix-first провижининг (ADR-0002), values → свойства offer'а.
export default defineEventHandler(async (event) => {
  requireRole(event, 'manager')
  const portal = event.context.portal as PortalDataType
  try {
    const body = await ModulePost.parseAsync(await readBody(event))
    const module = await provisionModule(body, portal)
    setResponseStatus(event, 201)
    return moduleToApi({ ...module, contract_id: module.contract_id })
  } catch (e) {
    console.error(e)
    if (e instanceof ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ') })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
