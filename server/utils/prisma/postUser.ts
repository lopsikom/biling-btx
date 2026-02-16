import { user_bitrixCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function upsertUserPrisma(id : number, ...args : user_bitrixCreateInput[]){
    const response = await Promise.all(args.map(async user => {
        return await prisma.user_bitrix.upsert({
        where : {bitrix_id_portal_id :{
            bitrix_id : user.bitrix_id,
            portal_id : id
        }},
        update : user,
        create : user
    });
    }))
    return response;
}
