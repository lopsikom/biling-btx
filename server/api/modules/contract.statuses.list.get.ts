import { getContractsStatusesPrisma } from "~~/server/utils/prisma/modules/Contract";


export default defineEventHandler(async (event) => {
    const messengers = await getContractsStatusesPrisma();
    return messengers;
})