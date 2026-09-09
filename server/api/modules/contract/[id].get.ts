import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { contractToApi, getContractById, requireContract } from '~~/server/utils/prisma/modules/Contract'
import { fault } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const id = getRouterParams(event).id
  const portal = event.context.portal as PortalDataType
  if (!id) {
    throw createError({
      statusCode: 404,
      statusMessage: 'none id'
    })
  }
  const parseId = parseInt(id)
  if (Number.isNaN(parseId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid id'
    })
  }
  const verify = await requireContract(parseId, portal.portal.id)
  if (!verify) throw fault('tenant.violation', { statusCode: 404, message: 'Запрошен объект другого портала' })
  const contract = await getContractById(parseId)
  if (!contract) {
    throw createError({
      statusCode: 404,
      statusMessage: 'no found contract'
    })
  }
  return contractToApi(contract)
})
