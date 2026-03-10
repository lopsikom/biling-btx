import { ZodError } from "zod";
import { portal } from "~~/server/services/models/generated/prisma/client"
import { getVatsList } from "~~/server/utils/prisma/modules/Vats";
import { IVatsFilter, VatsFilter } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    try{
        const portal = event.context.portal as portal
        if(!portal) {
            throw createError({
                statusCode: 401
            })
        }
        const query = getQuery(event);
        let filter : IVatsFilter | undefined = undefined;
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
        if(filter) filter = VatsFilter.parse(filter)
        const data = await getVatsList({portal_id : portal.id, filter : filter})
        return data
    }
    catch(e){
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