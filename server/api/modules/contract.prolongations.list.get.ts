import { getContractsProlongationsPrisma } from "~~/server/utils/prisma/modules/Contract";


export default defineEventHandler(async (event) => {
    const prolongations = await getContractsProlongationsPrisma();
    return prolongations;
})
