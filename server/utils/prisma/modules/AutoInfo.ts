import { autoinformation_moduleCreateInput, autoinformation_moduleUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IAutoinformationFilterUpdate } from "~~/shared/models/APIModels";

export async function getAutoinformationListPrisma(data : {portal_id? : number, filter? : IAutoinformationFilterUpdate}) {
    const {portal_id, filter} = data;
    const response = prisma.autoinformation_module.findMany({
        where : {
            quantity : filter?.quantity,
            price : filter?.price,
            active : filter?.active,
            title : filter?.title,
            contract : {
                id : filter?.contract_id,
                company : {
                    portal_id : portal_id,
                    bitrix_id : filter?.bitrix_id
                }
            },
            tariff : { id : filter?.tarrif_id},
            autoinformation_type : {id : filter?.type_id}
        },
        orderBy : {
            id : 'asc'
        }
    });
    return response;
}

export async function getAutoinformationByIdPrisma(id : number){
    const response = prisma.autoinformation_module.findFirst({
        where :{
            id : id
        }
    })
    return response;
}



export  async function deleteAutoInforPrisma(id : number){
    const response = await prisma.autoinformation_module.delete({
        where : {id : id}
    })
    return response
}

export async function patchAutoinfromationPrisma(id : number, data : autoinformation_moduleUpdateInput) {
    const response = prisma.autoinformation_module.update({
        where : {
            id : id
        },
        data : data
    })
    return response;
}

export async function postAutoinformationPrisma(data : autoinformation_moduleCreateInput){
    const response = await prisma.autoinformation_module.create({
        data : data
    })
    return response
}