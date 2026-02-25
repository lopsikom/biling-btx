import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function deleteContractPrisma(id : number){
    const response = await prisma.contract.delete({
        where : {id : id}
    })
    return response
}