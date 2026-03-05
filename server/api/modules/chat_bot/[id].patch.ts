import { chat_botUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { patchChatBotPrisma } from "~~/server/utils/prisma/modules/ChatBot";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
    console.log(body)
    let parseId : number;
    let data : chat_botUpdateInput;
    if(id){
        try{
            parseId = parseInt(id);
            data = chatBotInputUpdateMapPrisma(body);
        }catch(e){
            console.error(e);
            throw createError({
                statusCode : 400,
                statusMessage : "Invalid id"
            });
        }
        const chatBot = await patchChatBotPrisma(parseId, data, body.messengers);
        if(!chatBot){
            throw createError({
                statusCode : 404,
                statusMessage : "no found contract"
            })
        }
        
        return chatBotGetMapPrisma(chatBot)
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
}) 