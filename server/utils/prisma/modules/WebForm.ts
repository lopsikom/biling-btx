import { webform_webform_typeCreateManyInput, webformCreateInput, webformUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IWebFormFilterUpdate } from "~~/shared/models/APIModels";
import { IProductRow, IWebFormProdruct } from "~~/shared/models/bitrixModels";

export async function getWebformListPrisma(data : {portal_id? : number, filter? : IWebFormFilterUpdate}){
    const {portal_id, filter} = data
    const response = await prisma.webform.findMany({
        where : {
            contract : {
                id : filter?.contract_id,
                company : {
                    portal_id : portal_id,
                    bitrix_id : filter?.bitrix_id
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
            },
            contract : {select : {
                company_id : true
            }}
        },
        orderBy : {
            id : 'asc'
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
            },
            contract : {select : {
                company_id : true
            }}
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
            },
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}
export  async function deleteWebForm(id : number){
    const response = await prisma.webform.delete({
        where : {id : id},
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}

export  async function getIntegrations(){
    const response = await prisma.webform_type.findMany();
    return response
}
export function patchWebformPrisma(id : number, data : webformUpdateInput, integrations? : number[]){
    if(integrations) data.webform_webform_type = {deleteMany: {}, create : integrations.map(i => {return {type_id : i}})}
    const response = prisma.webform.update({
        where : {
            id : id
        },
        data : data,
        include : {
            webform_webform_type : {
                select : {
                    webform_type : {
                        select : {
                            name : true
                        }
                    }
                }
            },
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}
export async function postWebFormPrisma(data : webformCreateInput){
    const response = prisma.webform.create({
        data : data,
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}

export async function postWebFormTypePrisma(id : number, types : number[]){
    const data = types.map(t => {return {webform_id : id, type_id : t} as webform_webform_typeCreateManyInput})
    await prisma.webform_webform_type.createMany({
        data : data
    })
    const  webformData = await getWebformTypeWebformPrisma(id);
    return webformData
}

export async function upsertWebFormProductPrisma(data : {info : IWebFormProdruct, productRows : IProductRow}, portal_id : number){
    const {info, productRows} = data
    const response = prisma.webform.upsert({
    where : {portal_id_bitrix_id :{
        bitrix_id : info.id,
        portal_id : portal_id
    }},
    create : {
        contract : {connect : {portal_id_bitrix_id : {
            bitrix_id : productRows.ownerId,
            portal_id : portal_id
        }}},
        price : productRows.price,
        active : true,
        bitrix_id : productRows.id,
        product_id : productRows.productId,
        portal : {connect : {id : portal_id}},
        title : info.name,
        tariff : {connect : {id : 1}},
        },
    update : {
        contract : {connect : {portal_id_bitrix_id : {
            bitrix_id : productRows.ownerId,
            portal_id : portal_id
        }}},
        price : productRows.price,
        active : true,
        bitrix_id : productRows.id,
        product_id : productRows.productId,
        portal : {connect : {id : portal_id}},
        title : info.name,
        tariff : {connect : {id : 1}},
    },
   })
   return response
}