import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function deleteWebForm(id : number){
    const response = await prisma.webform.delete({
        where : {id : id}
    })
    return response
}