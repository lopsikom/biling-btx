import { portal } from "~~/server/services/models/generated/prisma/client"
import { getVatsList } from "~~/server/utils/prisma/getVats";
import { IVatsFilter } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
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
        }
    }
    const data = await getVatsList({portal_id : portal.id, filter : filter})
    return data
    
})