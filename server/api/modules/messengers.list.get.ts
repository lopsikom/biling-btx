import getMessengersPrisma from "~~/server/utils/prisma/getMessengers"

export default defineEventHandler(async (event) => {
    const messengers = await getMessengersPrisma();
    return messengers;
})