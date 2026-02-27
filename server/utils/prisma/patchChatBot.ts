import { chat_botUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default function patchChatBotPrisma(id : number, data : chat_botUpdateInput, messengers? : number[]){
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
// Добавить гибкое удаление и добавление месеенджеров
// export default function patchChatBotMessengersPrisma(id : number, data : number[]){
//     const data 
// }