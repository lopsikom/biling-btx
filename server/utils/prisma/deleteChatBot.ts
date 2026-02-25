import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function deleteChatBotPrisma(id : number){
    const response = await prisma.chat_bot.delete({
        where : {id : id}
    })
    return response
}