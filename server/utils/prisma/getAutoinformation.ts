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
                    portal_id : portal_id
                }
            },
            tariff : { id : filter?.tarrif_id},
            autoinformation_type : {id : filter?.type_id}
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