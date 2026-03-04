import { portalWhereInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function getPortalPrisma(data : portalWhereInput){
    return await prisma.portal.findFirst({
        where : data
    })
}

export async function getPortalsPrisma(data? : portalWhereInput){
    return await prisma.portal.findMany({
        where : data
    })
} 

export type portalPrisma = ReturnType<typeof getPortalPrisma>
