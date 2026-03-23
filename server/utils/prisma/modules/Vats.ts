import { vatsCreateInput, vatsUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IVatsFilter } from "~~/shared/models/APIModels";

export async function getVatsList(data : {portal_id? : number, filter? : IVatsFilter}){
    const {portal_id, filter} = data
    console.log(filter)
    const response = await prisma.vats.findMany({
        where : {
            additional_users : filter?.additional_users,
            duration : filter?.duration,
            active : filter?.active,
            price : filter?.price,
            title : filter?.title,
            contract : {
                id : filter?.contract_id,
                company : {
                    portal_id : portal_id,
                    bitrix_id : filter?.bitrix_id

                }
            },
            tariff : {
                id : filter?.tarrif_id
            }
            
        },
        orderBy : {
            id : 'asc'
        },
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}

export async function getVatsById(id : number){
    const response = await prisma.vats.findFirst({
        where : {
            id : id
        },
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}

export  async function deleteVatsPrisma(id : number){
    const response = await prisma.vats.delete({
        where : {id : id},
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}

export  async function patchVatsPrisma(id :number, data : vatsUpdateInput ){
    const response = await prisma.vats.update({
        where : {
            id : id
        },
        data : data,
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}

export async function postVatsPrisma(data : vatsCreateInput){
    const response = prisma.vats.create({
        data : data,
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}