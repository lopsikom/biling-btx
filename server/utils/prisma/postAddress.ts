import { addressCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function upsertAddress(id : number, ...args : addressCreateInput[]){
    const response = Promise.all(args.map(a => {
        prisma.address.upsert({
            where : {
                company_id_entity_type_id_portal_id : {
                    portal_id : id,
                    entity_type_id : a.entity_type_id,
                    company_id : a.company.connect!.id!
                }
            },
            update : a,
            create : a
        })
    }))
    return response
} 