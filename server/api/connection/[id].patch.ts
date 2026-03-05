import { connectionPatchPrisma } from "~~/server/utils/prisma/Connection";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
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
            const vats = await connectionPatchPrisma(body, parseId);
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