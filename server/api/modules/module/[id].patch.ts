import * as z from 'zod'
import { updateModuleProvisioning } from '~~/server/services/moduleProvisioning'
import { moduleToApi, requireModule } from '~~/server/utils/prisma/modules/Module'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { requireRole } from '~~/server/utils/requireRole'
import { ModuleUpdate } from '~~/shared/models/APIModels'
import { fault, refusal, zodFields } from '~~/server/utils/errors'
import { isError } from 'h3'

// Правка модуля: Bitrix-first, field_values из тела (replace-зеркало, ADR-0005).
export default defineEventHandler(async (event) => {
  requireRole(event, 'manager')
  const id = getRouterParams(event).id
  const portal = event.context.portal as PortalDataType
  if (!id) throw createError({ statusCode: 404, statusMessage: 'none id' })
  try {
    const parseId = z.coerce.number().parse(id)
    if (!(await requireModule(parseId, portal.portal.id))) throw fault('tenant.violation', { statusCode: 404, message: 'Запрошен объект другого портала' })
    const body = await ModuleUpdate.parseAsync(await readBody(event))
    const module = await updateModuleProvisioning(parseId, body, portal)
    return moduleToApi(module)
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw refusal('validation.failed', 400, { message: e.issues.map(i => i.message).join(', '), details: zodFields(e) })
    }
    if (isError(e)) throw e
    throw fault('internal', { cause: e })
  }
})
