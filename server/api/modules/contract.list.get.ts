import { portal } from "~~/server/services/models/generated/prisma/client"
import {IContract, IContractFilter} from "~~/shared/models/APIModels"
import { contractGetMapPrisma } from "~~/server/utils/mappers"
import { getContractList } from "~~/server/utils/prisma/modules/Contract"


export default  defineEventHandler(async (event) =>{
    const portal = event.context.portal as portal
    if(!portal) {
        throw createError({
            statusCode: 401
        })
    }
    const query = getQuery(event);
    let filter : IContractFilter | undefined = undefined;
    if(query.filter){
        try{
            filter = JSON.parse(query.filter as string)
        }catch(e){
            console.warn("Невалидный filter JSON", query.filter)
        }
    }
    const data = await getContractList({portal_id : portal.id, filter : filter})
    const contracts = contractGetMapPrisma(data)

    return contracts
})