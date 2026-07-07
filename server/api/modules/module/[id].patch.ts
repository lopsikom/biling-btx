import * as z from 'zod'
import { updateModuleProvisioning } from '~~/server/services/moduleProvisioning'
import { moduleToApi, requireModule } from '~~/server/utils/prisma/modules/Module'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { ModuleUpdate } from '~~/shared/models/APIModels'

// Правка модуля: Bitrix-first, field_values из тела (replace-зеркало, ADR-0005).
export default defineEventHandler(async (event) => {
  const id = getRouterParams(event).id
  const portal = event.context.portal as PortalDataType
  if (!id) throw createError({ statusCode: 404, statusMessage: 'none id' })
  try {
    const parseId = z.coerce.number().parse(id)
    if (!(await requireModule(parseId, portal.portal.id))) throw createError({ statusCode: 404, statusMessage: 'not verify portal' })
    const body = await ModuleUpdate.parseAsync(await readBody(event))
    const module = await updateModuleProvisioning(parseId, body, portal)
    return moduleToApi(module)
  } catch (e) {
    console.error(e)
    if (e instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: e.issues.map(i => i.message).join(', ') })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
