import { chat_bot_messengersCreateManyInput, chat_botCreateInput, chat_botUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IChatBotFilter } from "~~/shared/models/APIModels";

export async function getChatBotListPrisma(data : {portal_id? : number, filter? : IChatBotFilter}){ //Фильтр по мессенджерам
    const {portal_id, filter} = data
    const response = await prisma.chat_bot.findMany({
        where : {
            contract : {
                id : filter?.contract_id,
                company : {
                    portal_id : portal_id,
                    bitrix_id : filter?.bitrix_id
                }
            },
            tariff : {
                id : filter?.tarrif_id
            },
            lines_count : filter?.lines_count,
            title : filter?.title,
            active : filter?.active,
            price : filter?.price,
        },
        include : {
            chat_bot_messengers : {
                select : {
                    messengers : {
                        select : {
                            name : true
                        }
                    }
                }
            }
        },
        orderBy : {
            id : 'asc'
        }
    })
    
    return response;
}

export async function getChatBotById(id : number){
    const response = await prisma.chat_bot.findFirst({
        where : {
            id : id
        },
        include : {
            chat_bot_messengers : {
                select : {
                    messengers : {
                        select :{
                            name : true
                        }
                    }
                }
            }
        }
    })
    return response;
}




export async function getChatBotMessengersPrisma(id : number){
    const response = await prisma.chat_bot_messengers.findMany({
        where : {
            chat_bot_id : id
        },
        include : {
            messengers : {
                select :{
                    name : true
                }
            }
        },
    })
    return response.map(m => m.messengers.name);
}
export async function deleteChatBotPrisma(id : number){
    const response = await prisma.chat_bot.delete({
        where : {id : id}
    })
    return response
}
export async function patchChatBotPrisma(id : number, data : chat_botUpdateInput, messengers? : number[]){
    if(messengers) data.chat_bot_messengers = {deleteMany : {}, create : messengers.map(m => { return {messenger_id : m}})}
    const response = prisma.chat_bot.update({
        where : {
            id : id
        },
        data : data,
        include : {
            chat_bot_messengers :{
                select : {
                    messengers : {
                        select : {
                            name : true
                        }
                    }
                }
            }
        }
    })
    return response
}
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

export async function getMessengersPrisma(){
    const response = prisma.messengers.findMany();
    return response
}