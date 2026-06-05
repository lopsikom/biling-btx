import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getAutoinformationByIdPrisma, requireAutoInfo } from "~~/server/utils/prisma/modules/AutoInfo";

export default defineEventHandler(async (event) => {
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
            const verify = await requireAutoInfo(parseId, portal.portal.id)
            if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
            const autoinformation_module = await getAutoinformationByIdPrisma(parseId)
                if(!autoinformation_module){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found contract"
                    })
                }
                return autoinformation_module
        }
        else{
            throw createError({
                statusCode : 404,
                statusMessage : "none id"
            })
        }
})