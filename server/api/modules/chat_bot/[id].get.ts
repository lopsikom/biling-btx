import { getChatBotById } from "~~/server/utils/prisma/modules/ChatBot";

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
            const chatBot = await getChatBotById(parseId)
                if(!chatBot){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found contract"
                    })
                }
                return chatBotGetMapPrisma(chatBot);
        }
        else{
            throw createError({
                statusCode : 404,
                statusMessage : "none id"
            })
        }
})