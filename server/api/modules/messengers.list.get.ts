import { getMessengersPrisma } from "~~/server/utils/prisma/modules/ChatBot";


export default defineEventHandler(async (event) => {
    const messengers = await getMessengersPrisma();
    return messengers;
})