import { connectionGetByIdPrisma } from "~~/server/utils/prisma/Connection";

export default defineEventHandler(async (event) =>{
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
