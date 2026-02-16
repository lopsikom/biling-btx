import { requisiteCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function upsertRequisites(id : number, ...args : requisiteCreateInput[]) {
    const response = await Promise.all(args.map(async requisite => {
        return await prisma.requisite.upsert({
        where : {bitrix_id_portal_id : {
            portal_id : id,
            bitrix_id : requisite.bitrix_id
        }},
        update : requisite,
        create : requisite
    })
    }))
    return response
}