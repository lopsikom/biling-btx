import { getAutoinformationByIdPrisma } from "~~/server/utils/prisma/modules/AutoInfo";

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