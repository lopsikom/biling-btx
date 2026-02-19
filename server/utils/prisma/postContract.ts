import { contractCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function addContractPrisma(data : contractCreateInput) {
    const response = await prisma.contract.create({
        data : data,
        include : {
            contract_status : true
        }
    })
    return response
}