import { webformGetMapPrisma } from "~~/server/utils/mappers";
import { getWebformByIdPrisma } from "~~/server/utils/prisma/getWebform";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
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