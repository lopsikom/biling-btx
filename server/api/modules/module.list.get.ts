import z, { ZodError } from 'zod'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { getModuleList, moduleToApi } from '~~/server/utils/prisma/modules/Module'
import { ModuleFilter, type IModuleFilter } from '~~/shared/models/APIModels'

export default defineEventHandler(async (event) => {
  try {
    const portal = event.context.portal as PortalDataType
    const { filter } = getQuery(event)
    let filterParse: IModuleFilter | undefined
    if (filter) {
      try { filterParse = ModuleFilter.parse(JSON.parse(filter as string)) } catch (e) {
        if (e instanceof ZodError) throw e
        throw createError({ statusCode: 400, statusMessage: 'Invalid filter' })
      }
    }
    const data = await getModuleList(portal.portal.id, filterParse)
    return data.map(moduleToApi)
  } catch (e) {
    console.error(e)
    if (e instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: e.issues.map(i => i.message).join(', ') })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
