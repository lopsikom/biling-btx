import { vatsCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function postVatsPrisma(data : vatsCreateInput){
    const response = prisma.vats.create({
        data : data
    })
    return response
}