import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { getModuleById, moduleToApi, requireModule } from '~~/server/utils/prisma/modules/Module'
import { fault, refusal } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const id = getRouterParams(event).id
  const portal = event.context.portal as PortalDataType
  if (!id) throw createError({ statusCode: 404, statusMessage: 'none id' })
  const parseId = parseInt(id)
  if (Number.isNaN(parseId)) throw refusal('validation.failed', 400, { message: 'Некорректный id' })
  if (!(await requireModule(parseId, portal.portal.id))) throw fault('tenant.violation', { statusCode: 404, message: 'Запрошен объект другого портала' })
  const module = await getModuleById(parseId, portal.portal.id)
  if (!module) throw createError({ statusCode: 404, statusMessage: 'no found module' })
  return moduleToApi(module)
})
