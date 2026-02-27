import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function getContractsStatusesPrisma(){
    const response = prisma.contract_status.findMany()
    return response
}