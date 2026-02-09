import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function getPortalPrisma(domain : string, client_id? : string){
    return await prisma.portal.findFirst({
        where: {
            domain : domain,
            client_id : client_id
        }
    })
}

