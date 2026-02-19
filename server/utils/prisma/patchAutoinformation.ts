import { autoinformation_moduleUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function patchAutoinfromationPrisma(id : number, data : autoinformation_moduleUpdateInput) {
    const response = prisma.autoinformation_module.update({
        where : {
            id : id
        },
        data : data
    })
    return response;
}