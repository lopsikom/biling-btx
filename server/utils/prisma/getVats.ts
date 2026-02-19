import { prisma } from "~~/server/services/prisma/prismaClient";
import { IVatsFilter } from "~~/shared/models/APIModels";

export async function getVatsList(data : {portal_id? : number, filter? : IVatsFilter}){
    const {portal_id, filter} = data
    const response = await prisma.vats.findMany({
        where : {
            additional_users : filter?.additional_user,
            duration : filter?.duration,
            active : filter?.active,
            price : filter?.price,
            title : filter?.title,
            contract : {
                id : filter?.contract_id,
                company : {
                    portal_id : portal_id
                }
            },
            tariff : {
                id : filter?.tarrif_id
            }
            
        }
    })
    return response
}

export async function getVatsById(id : number){
    const response = await prisma.vats.findFirst({
        where : {
            id : id
        }
    })
    return response
}