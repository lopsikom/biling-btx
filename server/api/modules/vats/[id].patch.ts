import { vatsUpdateInput } from "~~/server/services/models/generated/prisma/models";
import patchVatsPrisma from "~~/server/utils/prisma/patchVats";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
        let parseId : number;
        let data : vatsUpdateInput;
        if(id){
            try{
                parseId = parseInt(id);
                data = vatsUpdateMapPrisma(body);
            }catch(e){
                console.error(e);
                throw createError({
                    statusCode : 400,
                    statusMessage : "Invalid id"
                });
            }
            console.log(data)
            const vats = await patchVatsPrisma(parseId, data);
                if(!vats){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found vats"
                    })
                }
                return vats
        }
        else{
            throw createError({
                statusCode : 404,
                statusMessage : "none id"
            })
        }
})