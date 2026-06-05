import { voice_robotCreateInput, voice_robotUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IVoiceRobotFilter } from "~~/shared/models/APIModels";
import { IProductRow, IVoiceRobotProduct } from "~~/shared/models/bitrixModels";

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
        },
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}

export async function getVoiceRobotByIdPrisma(id : number){
    const response = await prisma.voice_robot.findFirst({
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
export async function deleteVoiceRobotPrisma(id : number, portal_id? : number){
    if(portal_id){
        const response = await prisma.voice_robot.delete({
        where : {portal_id_bitrix_id : {portal_id : portal_id, bitrix_id : id}},
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
    }else{
        const response = await prisma.voice_robot.delete({
        where : {id : id},
        include : {
            contract : {select : {
                company_id : true
                }}
            }
        })
        return response
    }
}
export async function patchVoiceRobotPrisma(id : number, data : voice_robotUpdateInput){
    const response = prisma.voice_robot.update({
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
export async function postVoiceRobotPrisma(data : voice_robotCreateInput){
    const response = prisma.voice_robot.create({
        data : data,
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}
export async function upsertVoiceRobotProductPrisma(data : {info : IVoiceRobotProduct, productRows : IProductRow}, portal_id : number){
    const {info, productRows} = data
    const response = await prisma.voice_robot.upsert({
        where : {portal_id_bitrix_id : {
            bitrix_id : productRows.id,
            portal_id : portal_id
        }},
        create : {
            contract : {connect : {portal_id_bitrix_id : {
                bitrix_id  : productRows.ownerId,
                portal_id : portal_id
            }}},
            tariff : {connect : {id : info.property310.valueEnum === "Базовый" ? 1 : 2}},
            lines : Number(info.property311.valueEnum),
            active : true,
            price : productRows.price,
            title : productRows.productName,
            bitrix_id : productRows.id,
            product_id : productRows.productId,
            portal : {connect : {id : portal_id}}
        },
        update : {
            contract : {connect : {portal_id_bitrix_id : {
                bitrix_id  : productRows.ownerId,
                portal_id : portal_id
            }}},
            tariff : {connect : {id : info.property310.valueEnum === "Базовый" ? 1 : 2}},
            lines : Number(info.property311.valueEnum),
            active : true,
            price : productRows.price,
            title : productRows.productName
        },
        include : {
        contract : {select : {
                company_id : true
            }}
    }
    })
    return response
}

export async function postVoiceRobotProductPrisma(data : {info : IVoiceRobotProduct, productRows : IProductRow}, portal_id : number){
    const {info, productRows} = data
    const response = await prisma.voice_robot.create({
        data : {
            contract : {connect : {portal_id_bitrix_id : {
                bitrix_id  : productRows.ownerId,
                portal_id : portal_id
            }}},
            tariff : {connect : {id : info.property310.valueEnum === "Базовый" ? 1 : 2}},
            lines : Number(info.property311.valueEnum),
            active : true,
            price : productRows.price,
            title : info.name,
            bitrix_id : productRows.id,
            product_id : productRows.productId,
            portal : {connect : {id : portal_id}}
        },
        include : {
        contract : {select : {
                company_id : true
            }}
    }
    })
    return response
}

export async function requireVoiceRobot(id: number, portal_id: number) {
    const response = await prisma.voice_robot.findFirst({ where: { id, portal_id } })
    return !!response
}

export type VoiceRobotPrisma = NonNullable<Awaited<ReturnType<typeof getVoiceRobotByIdPrisma>>>