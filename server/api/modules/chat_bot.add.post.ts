import { IChatBotPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as IChatBotPost;
    try{
        const chat_bot = await postChatBotPrisma(chatBotInputUpdateMapPrisma(body));
        if(!chat_bot) { setResponseStatus(event, 400); return; }
        const messengers = await postChatBotMessengersPrisma(chat_bot.id, body.messengers)
        setResponseStatus(event, 201);
        return {...chat_bot, messengers : messengers}
    }catch(e){
        console.error(e);
        throw createError({
            statusCode : 400,
            statusMessage : "Validation error"
        })
    }
})