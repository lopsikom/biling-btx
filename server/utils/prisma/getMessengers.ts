import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function getMessengersPrisma(){
    const response = prisma.messengers.findMany();
    return response
}