import { eventsCreateInput, eventsFindManyArgs } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IEventFilter } from "~~/shared/models/APIModels";

export async function postEventPrisma(data : eventsCreateInput) {
    const response = prisma.events.create({
        data : data
    })
    return response
}
export async function eventListPrisma(data : {filter? : IEventFilter, portal_id? :number}) : Promise<EventPrisma[]>;
export async function eventListPrisma(data : {filter? : IEventFilter, portal_id? :number}, pagination? : {after? : number, limit? : number}) : Promise<EventListPrismaWithPagination>;
export async function eventListPrisma(data : {filter? : IEventFilter, portal_id? :number}, pagination? : {after? : number, limit? : number}) {
    const {filter, portal_id} = data
    const args = {
        where : {
            userid : filter?.userId,
            action : filter?.action,
            entity : filter?.entity,
            entityName : filter?.entityName,
            createdAt : filter?.createdAt
        },
        orderBy : {
            id : "desc"
        },
        
    } as eventsFindManyArgs
    if(typeof filter?.companyId === "string") args.where!.company = {bitrix_id : filter.companyId , portal_id : portal_id};
    else {
        if(filter?.companyId) args.where!.company = {id : filter.companyId, portal_id : portal_id}
    }
    if(pagination) {
        if(pagination.after) args.skip = pagination.after;
        if(pagination.limit) args.take = pagination.limit;
        const response = await prisma.$transaction([
            prisma.events.findMany(args),
            prisma.events.count({where : args.where})
        ])
        const [list, count] = response
        return {
            data : list,
            count : count
        }
    }
    else{
        const response = await prisma.events.findMany(args);
        return response;
    }
} 

export type EventPrisma = Awaited<ReturnType<typeof postEventPrisma>>
export type EventListPrismaWithPagination = {
    data : EventPrisma[],
    count : number
}
