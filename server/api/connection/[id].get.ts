import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { connectionGetByIdPrisma, requireConnection } from "~~/server/utils/prisma/Connection";
import { fault } from '~~/server/utils/errors'

export default defineEventHandler(async (event) =>{
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    let parseId : number;
    if(id){
        try{
            parseId = parseInt(id);
        }catch(e){
            throw createError({
                statusCode : 400,
                statusMessage : "Invalid id"
            });
        }
        const verify = await requireConnection(parseId, portal.portal.id)
        if (!verify) throw fault('tenant.violation', { statusCode: 404, message: 'Запрошен объект другого портала' })
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
