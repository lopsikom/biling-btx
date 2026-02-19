import { autoinformation_moduleCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function postAutoinformationPrisma(data : autoinformation_moduleCreateInput){
    const response = await prisma.autoinformation_module.create({
        data : data
    })
    return response
}