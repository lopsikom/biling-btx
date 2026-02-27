import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function deleteAutoInforPrisma(id : number){
    const response = await prisma.autoinformation_module.delete({
        where : {id : id}
    })
    return response
}