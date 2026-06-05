import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getChatBotById, requireChatBot } from "~~/server/utils/prisma/modules/ChatBot";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
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
            const verify = await requireChatBot(parseId, portal.portal.id)
            if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
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