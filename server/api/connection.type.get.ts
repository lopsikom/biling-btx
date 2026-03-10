import { prisma } from "../services/prisma/prismaClient"

export default defineEventHandler(async (event) => {
    const data = prisma.connection_type.findMany();
    return data
})