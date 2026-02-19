import { prisma } from "~~/server/services/prisma/prismaClient";
import { IWebFormFilterUpdate } from "~~/shared/models/APIModels";

export async function getWebformListPrisma(data : {portal_id? : number, filter? : IWebFormFilterUpdate}){
    const {portal_id, filter} = data
    const response = await prisma.webform.findMany({
        where : {
            contract : {
                id : filter?.contract_id,
                company : {
                    portal_id : portal_id
                }
            },
            tariff : {id : filter?.tarrif_id},
            active : filter?.active,
            price : filter?.price,
            title : filter?.title,
        },
        include : {
            webform_webform_type : {
                select : {
                    webform_type : {
                        select : {
                            name :true
                        }
                    }
                }
            }
        }
    })
    return response;
}

export async function getWebformByIdPrisma(id : number){
    const response = await prisma.webform.findFirst({
        where : {
            id : id
        },
        include : {
            webform_webform_type : {
                select : {
                    webform_type : {
                        select : {
                            name : true
                        }
                    }
                }
            }
        }
    })
    return response
}

export async function getWebformTypeWebformPrisma(id : number){
    const response = await prisma.webform_webform_type.findMany({
        where : {
            webform_id : id
        },
        include : {
            webform_type : {
                select : {
                    name : true
                }
            }
        }
    })
    return response
}