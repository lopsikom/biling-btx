import { webformGetMapPrisma } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getWebformByIdPrisma, requireWebform } from "~~/server/utils/prisma/modules/WebForm";

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
            const verify = await requireWebform(parseId, portal.portal.id)
            if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
            const webform = await getWebformByIdPrisma(parseId)
                if(!webform){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found contract"
                    })
                }
                return webformGetMapPrisma(webform);
        }
        else{
            throw createError({
                statusCode : 404,
                statusMessage : "none id"
            })
        }
})