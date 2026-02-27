import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function patchPortal(id : number, refresh_token? : string, access_token? : string){
    return await prisma.portal.update({
        where : {
            id : id
        },
        data : {
            refresh_token : refresh_token,
            access_token : access_token
        }
    })
}