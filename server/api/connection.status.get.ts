import { prisma } from "../services/prisma/prismaClient"

export default defineEventHandler(async (event) => {
    const data = prisma.connection_status.findMany();
    return data
})