import z, { ZodError } from 'zod'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { contractToApi, getContractList } from '~~/server/utils/prisma/modules/Contract'
import { ContractFilter, type IContractFilter } from '~~/shared/models/APIModels'

export default defineEventHandler(async (event) => {
  try {
    const portal = event.context.portal as PortalDataType
    const { filter, skip, limit } = getQuery(event)
    let filterParse: IContractFilter | undefined = undefined
    let skipParse: number | undefined
    let limitParse: number | undefined
    if (filter) {
      try {
        filterParse = JSON.parse(filter as string)
      } catch {
        console.warn('Невалидный filter JSON', filter)
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid filter'
        })
      }
    }
    if (filterParse) filterParse = ContractFilter.parse(filterParse)
    if (skip) skipParse = z.coerce.number().parse(skip)
    if (limit) limitParse = z.coerce.number().parse(limit)
    if (skipParse || limitParse) {
      const data = await getContractList({ portal_id: portal.portal.id, filter: filterParse }, { after: skipParse, limit: limitParse })
      return { data: contractToApi(data.data), count: data.count }
    } else {
      const data = await getContractList({ portal_id: portal.portal.id, filter: filterParse })
      return contractToApi(data)
    }
  } catch (e) {
    console.error(e)
    if (e instanceof ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: 'Vallidation Error',
        message: mess
      })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({
      statusCode: 500,
      statusMessage: 'Server Error'
    })
  }
})
