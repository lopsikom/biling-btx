import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function deleteVatsPrisma(id : number){
    const response = await prisma.vats.delete({
        where : {id : id}
    })
    return response
}