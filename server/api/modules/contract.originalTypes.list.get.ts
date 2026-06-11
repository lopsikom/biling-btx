import { getContractsOriginalTypesPrisma } from "~~/server/utils/prisma/modules/Contract";


export default defineEventHandler(async (event) => {
    const originalTypes = await getContractsOriginalTypesPrisma();
    return originalTypes;
})
