import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { connectionGetByIdPrisma, requireConnection } from "~~/server/utils/prisma/Connection";

export default defineEventHandler(async (event) =>{
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    let parseId : number;
    if(id){
        try{
            parseId = parseInt(id);
        }catch(e){
            console.error(e);
            throw createError({
                statusCode : 400,
                statusMessage : "Invalid id"
            });
        }
        const verify = await requireConnection(parseId, portal.portal.id)
        if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
        const connection = await connectionGetByIdPrisma(parseId);
            if(!connection){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found vats"
                })
            }
            return connection;
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})
