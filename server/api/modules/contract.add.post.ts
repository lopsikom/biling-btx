import { ZodError } from 'zod'
import companyClient from '~~/server/services/bitrix/CompanyClient'
import type { EventEntity } from '~~/server/services/EventsAudit'
import { eventsAudit } from '~~/server/services/EventsAudit'
import { saveShapshotProduct } from '~~/server/services/webHooksEvents'
import { contractInputMapPrisma, contractMapBitrix } from '~~/server/utils/mappers'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { addContractPrisma } from '~~/server/utils/prisma/modules/Contract'
import getMyCompanysCache from '~~/server/utils/redis/getMyCompanys'
import { ContractPost, entityType } from '~~/shared/models/APIModels'

export default defineEventHandler(async (event) => {
  const portal = event.context.portal as PortalDataType
  const body = await readBody(event)
  try {
    const ZBody = await ContractPost.parseAsync(body)
    const bitrixCompany = new companyClient(portal!.portal.domain, portal!.portal.id, ZBody.bitrix_id!)
    const myCompanys = await getMyCompanysCache(portal)
    const myCompany = myCompanys.find(c => c.title === ZBody.org_name) ?? myCompanys[0]
    const bitirixContract = await bitrixCompany.addContract(await contractMapBitrix(ZBody, { user_id: Number(portal!.bitrix_user_id), company_id: myCompany.id })) // Пофиксить строковый айди
    const contract = await addContractPrisma(contractInputMapPrisma(ZBody, portal!.portal.id, bitirixContract.result.item.id!))
    setResponseStatus(event, 201)
    eventsAudit.emit('entity.create', {
      userid: portal?.user_id,
      entity: entityType.CONTRACT,
      entityName: contract.name,
      companyid: contract.company_id
    } as EventEntity)
    await saveShapshotProduct(contract.bitrix_id!, portal!.portal.id, [])
    return contractGetMapPrisma(contract)
  } catch (e) {
    console.error(e)
    if (e instanceof ZodError) {
      console.error(e.issues)
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw createError({
        statusCode: 400,
        statusMessage: 'Vallidation Error',
        message: mess
      })
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server Error'
      })
    }
  }
})
