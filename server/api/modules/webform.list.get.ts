import { portal } from "~~/server/services/models/generated/prisma/client";
import { webformGetMapPrisma } from "~~/server/utils/mappers";
import { getWebformListPrisma } from "~~/server/utils/prisma/getWebform";
import { IWebFormFilterUpdate } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const portal = event.context.portal as portal
    if(!portal) {
        throw createError({
            statusCode: 401
        })
    }
    const query = getQuery(event);
    let filter : IWebFormFilterUpdate | undefined = undefined;
    if(query.filter){
        try{
            filter = JSON.parse(query.filter as string)
        }catch(e){
            console.warn("Невалидный filter JSON", query.filter)
        }
    }
    const data = await getWebformListPrisma({portal_id : portal.id, filter : filter});
    return webformGetMapPrisma(data);

})