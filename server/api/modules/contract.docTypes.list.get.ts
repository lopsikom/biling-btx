import { getContractsDocTypesPrisma } from "~~/server/utils/prisma/modules/Contract";


export default defineEventHandler(async (event) => {
    const docTypes = await getContractsDocTypesPrisma();
    return docTypes;
})
