import { autoinformation_moduleUpdateInput } from "~~/server/services/models/generated/prisma/models";
import patchAutoinfromationPrisma from "~~/server/utils/prisma/patchAutoinformation";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
        let parseId : number;
        let data : autoinformation_moduleUpdateInput;
        if(id){
            try{
                parseId = parseInt(id);
                data = autoinformationInputMapPrisma(body);
            }catch(e){
                console.error(e);
                throw createError({
                    statusCode : 400,
                    statusMessage : "Invalid id"
                });
            }
            const autoinformation_module = await patchAutoinfromationPrisma(parseId, data);
                if(!autoinformation_module){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found vats"
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