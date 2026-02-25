import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function getIntegrations(){
    const response = await prisma.webform_type.findMany();
    return response
}