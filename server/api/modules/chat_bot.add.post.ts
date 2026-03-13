import { ZodError } from "zod";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { chat_botCreateInput, chat_botUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { postChatBotMessengersPrisma, postChatBotPrisma } from "~~/server/utils/prisma/modules/ChatBot";
import { ChatBotPost, entityType, IChatBotPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as IChatBotPost;
    const portal = event.context.portal as PortalDataType
    try{
        const ZBody = ChatBotPost.transform(val => chatBotInputUpdateMapPrisma(val as IChatBotPost)).parse(body)
        const chat_bot = await postChatBotPrisma(ZBody as chat_botCreateInput);
        if(!chat_bot) { setResponseStatus(event, 400); return; }
        const messengers = await postChatBotMessengersPrisma(chat_bot.id, body.messengers)
        setResponseStatus(event, 201);
        eventsAudit.emit("entity.create", {
                userid : portal?.user_id,
                entity : entityType.CHAT_BOT,
                entityName : chat_bot.title,
                companyid : chat_bot.contract?.company_id
            } as EventEntity) 
        return {...chat_bot, tarrif_id : chat_bot.tariff_id, messengers : messengers}
    }catch(e){
        console.error(e)
        if(e instanceof ZodError){
            console.error(e.issues);
            const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
            throw createError({
                statusCode : 400,
                statusMessage : "Vallidation Error",
                message : mess
            })
        }
        else {
            throw createError({
                statusCode: 500,
                statusMessage : "Server Error"
            })
        }
    }
})