import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function getCompanyPrisma(id : string, portal_id : number){
    const response = await prisma.company.findFirst({where : {portal_id : portal_id, bitrix_id : id}})
    return response
}