import { contractUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function patchContractPrisma(id : number, data : contractUpdateInput){
    const response = await prisma.contract.update({
        where : {
            id : id
        },
        data : data,
        include : {
            contract_status : true
        }
    })
    return response
}