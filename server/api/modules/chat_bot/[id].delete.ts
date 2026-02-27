import deleteChatBotPrisma from "~~/server/utils/prisma/deleteChatBot";

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
        const autoinformation = await deleteChatBotPrisma(parseId);
            if(!autoinformation){
                return false;
            }
            return true;
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})