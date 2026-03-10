import { portal } from "~~/server/services/models/generated/prisma/client"
import {ContractFilter, IContract, IContractFilter} from "~~/shared/models/APIModels"
import { contractGetMapPrisma } from "~~/server/utils/mappers"
import { getContractList } from "~~/server/utils/prisma/modules/Contract"
import { ZodError } from "zod"


export default  defineEventHandler(async (event) =>{
    try{
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
                throw createError({
                    statusCode : 400,
                    statusMessage : "Invalid filter"
                })
            }
        }
        if(filter) filter = ContractFilter.parse(filter)
        const data = await getContractList({portal_id : portal.id, filter : filter})
        const contracts = contractGetMapPrisma(data)

        return contracts
    }catch(e){
        console.error(e)
        if(e instanceof ZodError){
            console.error(e.issues);
            const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
            throw createError({
                statusCode : 400,
                statusMessage : "Vallidation Error",
                message : mess
            })
        }
        else {
            throw createError({
                statusCode: 500,
                statusMessage : "Server Error"
            })
        }
    }
})