import { prisma } from "~~/server/services/prisma/prismaClient";
import { IChatBotFilter } from "~~/shared/models/APIModels";

export async function getChatBotListPrisma(data : {portal_id? : number, filter? : IChatBotFilter}){ //Фильтр по мессенджерам
    const {portal_id, filter} = data
    const response = await prisma.chat_bot.findMany({
        where : {
            contract : {
                id : filter?.contract_id,
                company : {
                    portal_id : portal_id
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