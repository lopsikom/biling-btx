import { patchChatBotPrisma } from "~~/server/utils/prisma/modules/ChatBot";
import { ChatBotUpdate } from "~~/shared/models/APIModels";
import * as z from "zod"

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
    if(id){
        try{
            const data = await ChatBotUpdate.transform(val => chatBotInputUpdateMapPrisma(val)).parseAsync(body)
            const chatBot = await patchChatBotPrisma(z.coerce.number().parse(id), data, z.array(z.number()).parse(body.messengers ?? []));
            if(!chatBot){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found chat bot"
                })
            }
            return chatBotGetMapPrisma(chatBot);
        }catch(e){
            console.error(e);
            if(e instanceof z.ZodError){
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
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
}) 