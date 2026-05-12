import { connectionCreateInput, connectionFindManyArgs, connectionUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IConnectionPatch } from "~~/shared/models/APIModels";

export async function connectionPostPrisma(data : connectionCreateInput){
    const response = await prisma.connection.create({data : data});
    return response;
}

export async function connectionGetListPrisma(data : {filter? : IConnectionPatch, portal_id? :number}) {
    const {filter, portal_id} = data
    const args = {
        where : {
            title : filter?.title,
            source : filter?.source,
            connection_status : {id : filter?.status_id},
            connection_type : {id : filter?.type_id},
        },
        orderBy : {
            id : 'asc'
        }
    } as connectionFindManyArgs
    if(typeof filter?.company_id === "string") args.where!.company = {bitrix_id : filter.company_id , portal_id : portal_id};
    else {
        if(filter?.company_id) args.where!.company = {id : filter.company_id, portal_id : portal_id}
    }
    const response = await prisma.connection.findMany(args);
    return response;
}

export async function connectionGetByIdPrisma(id : number){
    const response = await prisma.connection.findFirst({where : {id : id}});
    return response;
}

export async function connectionPatchPrisma(id : number, data : IConnectionPatch) {
    const updateData = {
        title : data.title,
        source : data.source,
    } as connectionUpdateInput
    if(data.type_id) updateData.connection_type = {connect : {id : data.type_id}}
    if(data.status_id) updateData.connection_status = {connect : {id : data.status_id}}
    const response = await prisma.connection.update({where : {
        id : id
    },
    data : updateData
    })
    return response
}

export async function connectionDeletePrisma(id : number){
    const response = await prisma.connection.delete({where : {id : id}});
    return response;
}

export async function requireConnection(id: number, portal_id: number) {
    const response = await prisma.connection.findFirst({ where: { id, company: { portal_id } } })
    return !!response
}

export type connectionPrisma = Awaited<ReturnType<typeof connectionPostPrisma>>