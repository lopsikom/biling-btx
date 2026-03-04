import { IConnectionPatch } from "~~/shared/models/APIModels";
import { prisma } from "../services/prisma/prismaClient";
import { connectionGetListPrisma } from "../utils/prisma/Connection";

export default defineEventHandler(async (event) => {
    try{
        const portal = event.context.portal;
        if(!portal) {
            throw createError({
                statusCode: 401
            })
        }
        const query = getQuery(event);
        let filter : IConnectionPatch | undefined = undefined;
        if(query.filter){
            try{
                filter = JSON.parse(query.filter as string)
            }catch(e){
                console.warn("Невалидный filter JSON", query.filter)
            }
        }
        
        const data = await connectionGetListPrisma({filter : filter, portal_id : portal.id})
        return data
        }catch(e){
            console.error(e);
            throw createError({
                statusCode: 401,
                statusMessage : "Invalid data"
            })
        }
})