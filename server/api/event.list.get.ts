import { EventFilter, IEventFilter } from "~~/shared/models/APIModels";
import { PortalDataType } from "../utils/prisma/getPortalByUserBitrix"
import * as z from "zod"
import { eventListPrisma } from "../utils/prisma/Event";
import { ZodError } from "zod";

export default defineEventHandler(async (event) => {
    try{
        const portal = event.context.portal as PortalDataType
        let {filter, skip, limit} = getQuery(event);
        let filterParse : IEventFilter | undefined = undefined;
        let skipParse : number | undefined;
        let limitParse : number | undefined;
        if(filter){   
            try{
                filterParse = JSON.parse(filter as string)
                skipParse = parseInt(skip as string);
                limitParse = parseInt(limit as string);
            }catch(e){
                console.warn("Невалидный filter JSON")
                throw createError({
                    statusCode : 400,
                    statusMessage : "Invalid filter"
                })
            }
        }
        if(filterParse) filterParse = EventFilter.parse(filterParse);
        if(skip) skipParse = z.number().optional().parse(skipParse);
        if(limit) limitParse = z.number().optional().parse(limitParse);
        if(skipParse || limitParse){
            const data = await eventListPrisma({filter : filterParse, portal_id : portal?.portal.id}, {after : skipParse, limit : limitParse})
            return data
        }
        else{
            const data = await eventListPrisma({filter : filterParse, portal_id : portal?.portal.id})
            return data
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