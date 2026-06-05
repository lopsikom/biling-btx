import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function deleteCompanyPrisma(id : number) : Promise<void>;
export default async function deleteCompanyPrisma(id : string, portal_id : number) : Promise<void>;
export default async function deleteCompanyPrisma(id : string | number, portal_id? : number) : Promise<void>{
    if(portal_id && typeof id == "string"){
        const response = await prisma.company.delete({where : {
            bitrix_id_portal_id : { bitrix_id : id, portal_id : portal_id}
        }})
    }
    else {
        const response = await prisma.company.delete({where : {
            id : id as number
        }})
    }
}
