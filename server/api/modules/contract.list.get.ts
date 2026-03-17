import { portal } from "~~/server/services/models/generated/prisma/client"
import {ContractFilter, IContract, IContractFilter} from "~~/shared/models/APIModels"
import { contractGetMapPrisma } from "~~/server/utils/mappers"
import { getContractList } from "~~/server/utils/prisma/modules/Contract"
import z, { ZodError } from "zod"


export default  defineEventHandler(async (event) =>{
    try{
        const portal = event.context.portal as portal
        let {filter, skip, limit} = getQuery(event)
        let filterParse : IContractFilter | undefined = undefined;
        let skipParse : number | undefined;
        let limitParse : number | undefined;
        if(!portal) {
            throw createError({
                statusCode: 401
            })
        }
        if(filter){
            try{
                filterParse = JSON.parse(filter as string)
                skipParse = parseInt(skip as string);
                limitParse = parseInt(limit as string);
            }catch(e){
                console.warn("Невалидный filter JSON", filter)
                throw createError({
                    statusCode : 400,
                    statusMessage : "Invalid filter"
                })
            }
        }
        if(filterParse) filterParse = ContractFilter.parse(filterParse);
        if(skip) skipParse = z.number().optional().parse(skipParse);
        if(limit) limitParse = z.number().optional().parse(limitParse);
        if(skipParse || limitParse){
            const data = await getContractList({portal_id : portal.id, filter : filterParse}, {after : skipParse, limit : limitParse})
            const contracts = contractGetMapPrisma(data.data)
            return {data : contracts, count : data.count}
        }
        else{
            const data = await getContractList({portal_id : portal.id, filter : filterParse})
            const contracts = contractGetMapPrisma(data)
            return contracts
        }
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