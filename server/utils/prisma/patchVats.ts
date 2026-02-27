import { vatsUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function patchVatsPrisma(id :number, data : vatsUpdateInput ){
    const response = await prisma.vats.update({
        where : {
            id : id
        },
        data : data
    })
    return response
}