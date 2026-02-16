import { invoiceCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function upsertInvoice(id : number, ...args : invoiceCreateInput[]){
    const response = await Promise.all(args.map(i => {
        return prisma.invoice.upsert({
            where : {bitrix_id_portal_id : {
                portal_id : id,
                bitrix_id : i.bitrix_id
            }},
            update : i,
            create : i
        })
    }))
    return response
}