import {companyCreateInput, companyModel} from '~~/server/services/models/generated/prisma/models'
import { prisma } from '~~/server/services/prisma/prismaClient'


export default async function postCompanyPrisma(portal_id : number, ...args : companyCreateInput[]){
    const response = Promise.all(args.map(async company => {
        return await prisma.company.upsert({
        where : {bitrix_id_portal_id :{
            bitrix_id : company.bitrix_id,
            portal_id : portal_id
        }},
        update : company,
        create : company
        
    })
    }))
    return response;
}