import { prisma } from "~~/server/services/prisma/prismaClient";
import { IContractFilter } from "~~/shared/models/APIModels";

export async function getContractList(data : {portal_id? : number, filter? : IContractFilter}){
    const {portal_id, filter} = data
    const response = await prisma.contract.findMany({
        where : {
            name : filter?.name,
            company_id : filter?.company_id,
            contract_status : {
                name : filter?.status
            },
            date_begin : filter?.date_begin,
            date_close : filter?.date_close,
            org_name : filter?.org_name,
            company : {
                portal_id : portal_id,
                bitrix_id : filter?.bitrxi_company_id
            }
        },
        include : {
            contract_status : true
        },
        orderBy : {
            id : 'asc'
        }
        
    })
    return response
}
export async function getContractById(id : number){
    const response = await prisma.contract.findFirst({
        where : {
            id : id
        },
        include : {
            contract_status : true
        }
    })
    return response
}