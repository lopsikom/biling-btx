import { ZodError } from 'zod'
import { provisionModule } from '~~/server/services/moduleProvisioning'
import { moduleToApi } from '~~/server/utils/prisma/modules/Module'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { requireRole } from '~~/server/utils/requireRole'
import { ModulePost } from '~~/shared/models/APIModels'
import { fault, refusal, zodFields } from '~~/server/utils/errors'
import { isError } from 'h3'

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
    if (e instanceof ZodError) {
      throw refusal('validation.failed', 400, { message: e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', '), details: zodFields(e) })
    }
    if (isError(e)) throw e
    throw fault('internal', { cause: e })
  }
})
