import { contractCreateInput, contractFindManyArgs, contractUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IContractFilter } from "~~/shared/models/APIModels";

export async function getContractList(data : {portal_id? : number, filter? : IContractFilter}) : Promise<contractPrismaGet[]>
export async function getContractList(data : {portal_id? : number, filter? : IContractFilter}, pagination? : {after? : number, limit? : number}) : Promise<contractPrismaWithPagination>
export async function getContractList(data : {portal_id? : number, filter? : IContractFilter}, pagination? : {after? : number, limit? : number}){
    const {portal_id, filter} = data
    const args = {
        where : {
            name : {
                startsWith : filter?.name,
                mode : "insensitive"
            },
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
            id : 'desc'
        }
        
    } as contractFindManyArgs
    if(pagination){
        if(pagination.after) args.skip = pagination.after;
        if(pagination.limit) args.take = pagination.limit;
        const response = await prisma.$transaction([
            prisma.contract.findMany(args),
            prisma.contract.count({where : args.where})
        ])
        const [list, count] = response
        return {
            data : list,
            count : count
        }
    } 
    else{
        const response = await prisma.contract.findMany(args);
        return response;
    }
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

export async function deleteContractPrisma(id : number, portal_id? : number){
    const config = {
        where : portal_id ? {contract : {bitrix_id : id}} : {contract_id : id},
        data : {contract_id : null}
    }
    const response = await prisma.$transaction([
        prisma.webform.updateMany(config),
        prisma.autoinformation_module.updateMany(config),
        prisma.vats.updateMany(config),
        prisma.voice_robot.updateMany(config),
        prisma.chat_bot.updateMany(config),
        prisma.contract.delete({
            where : portal_id ? {portal_id_bitrix_id : {bitrix_id : id, portal_id : portal_id}} : {id : id}
        })
    ])
    return response
}

export async function patchContractPrisma(id : number, data : contractUpdateInput){
    const response = await prisma.contract.update({
        where : {
            id : id
        },
        data : data,
        include : { 
            contract_status : true
        }
    })
    return response
}

export async function upsertContractPrisma(portal_id : number, data : contractCreateInput){
    const response = await prisma.contract.upsert({
        where : {
            portal_id_bitrix_id : {
                bitrix_id : data.bitrix_id!,
                portal_id : portal_id
            }
        },
        update : data,
        create : data
    })
    return response;
}

export  async function addContractPrisma(data : contractCreateInput) {
    const response = await prisma.contract.create({
        data : data,
        include : {
            contract_status : true
        }
    })
    return response
}

export async function getContractsStatusesPrisma(){
    const response = prisma.contract_status.findMany()
    return response
}
export async function getTariffs(){
    const response = await prisma.tariff.findMany();
    return response
}
export type contractPrismaGet = Awaited<ReturnType<typeof addContractPrisma>>
export type contractPrismaWithPagination = {
    data : contractPrismaGet[],
    count : number
}
