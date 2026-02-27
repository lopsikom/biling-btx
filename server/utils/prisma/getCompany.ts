import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function getCompanyPrisma(id : string){
    const response = await prisma.company.findFirst({where : {bitrix_id : id}})
    return response
}