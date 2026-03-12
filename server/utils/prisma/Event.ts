import { eventsCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export async function postEventPrisma(data : eventsCreateInput) {
    const response = prisma.events.create({
        data : data
    })
    return response
} 

export type EventPrisma = Awaited<ReturnType<typeof postEventPrisma>>
