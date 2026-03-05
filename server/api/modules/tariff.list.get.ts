import { getTariffs } from "~~/server/utils/prisma/modules/Contract";

export default defineEventHandler(async (event) => {
    const tarrifs = await getTariffs();
    return tarrifs;
})