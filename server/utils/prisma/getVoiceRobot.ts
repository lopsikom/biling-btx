import { prisma } from "~~/server/services/prisma/prismaClient";
import { IVoiceRobotFilter } from "~~/shared/models/APIModels";

export async function getVoiceRobotListPrisma(data : {portal_id? : number, filter? : IVoiceRobotFilter}){
    const {portal_id, filter} = data
    const response = await prisma.voice_robot.findMany({
        where : {
            lines : filter?.lines,
            active : filter?.active,
            price : filter?.price,
            title : filter?.title,
            tariff : {id : filter?.tarrif_id},
            contract : {
                id : filter?.contract_id,
                company : {
                    portal_id : portal_id,
                    bitrix_id : filter?.bitrix_id
                }
            }
        },
        orderBy : {
            id : 'asc'
        }
    })
    return response
}

export async function getVoiceRobotByIdPrisma(id : number){
    const response = await prisma.voice_robot.findFirst({
        where : {
            id : id
        }
    })
    return response
}