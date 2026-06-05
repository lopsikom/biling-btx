import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getVatsById, requireVats } from "~~/server/utils/prisma/modules/Vats";


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
        const verify = await requireVats(parseId, portal.portal.id)
        if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
        const vats = await getVatsById(parseId);
            if(!vats){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found vats"
                })
            }
            return vats;
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})