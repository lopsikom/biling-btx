import getContractsStatusesPrisma from "~~/server/utils/prisma/getContractStatuses";

export default defineEventHandler(async (event) => {
    const messengers = await getContractsStatusesPrisma();
    return messengers;
})