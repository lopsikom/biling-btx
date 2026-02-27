import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function getTariffs(){
    const response = await prisma.tariff.findMany();
    return response
}