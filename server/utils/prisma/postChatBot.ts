import { chat_bot_messengersCreateManyInput, chat_botCreateInput, chat_botCreateManyInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { getChatBotMessengersPrisma } from "./getChatBot";


export async function postChatBotPrisma(data : chat_botCreateInput){
    const response = prisma.chat_bot.create({
        data : data
    })
    return response
}

export async function postChatBotMessengersPrisma(id : number, messengers : number[]){
    const data = messengers.map(m => {return {chat_bot_id : id, messenger_id : m} as chat_bot_messengersCreateManyInput})
    await prisma.chat_bot_messengers.createMany({
        data : data
    })
    const messengersData = await getChatBotMessengersPrisma(id);
    return messengersData
}