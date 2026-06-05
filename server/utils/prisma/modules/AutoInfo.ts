import { autoinformation_moduleCreateInput, autoinformation_moduleUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IAutoinformationFilterUpdate } from "~~/shared/models/APIModels";
import { IAutoInfoProduct, IProductRow, ISmsProduct } from "~~/shared/models/bitrixModels";

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
        },
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    });
    return response;
}

export async function getAutoinformationByIdPrisma(id : number){
    const response = prisma.autoinformation_module.findFirst({
        where :{
            id : id
        },
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response;
}



export  async function deleteAutoInforPrisma(id : number, portal_id? : number){
    if(portal_id){
        const response = await prisma.autoinformation_module.delete({
        where : {portal_id_bitrix_id : {portal_id : portal_id, bitrix_id : id}},
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
    }else{
        const response = await prisma.autoinformation_module.delete({
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

export async function patchAutoinfromationPrisma(id : number, data : autoinformation_moduleUpdateInput) {
    const response = prisma.autoinformation_module.update({
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
    return response;
}

export async function postAutoinformationPrisma(data : autoinformation_moduleCreateInput){
    const response = await prisma.autoinformation_module.create({
        data : data,
        include : {
            contract : {select : {
                company_id : true
            }}
        }
    })
    return response
}
export async function upsertAutoInformationProductPrisma(data : {info : ISmsProduct, productRows : IProductRow}, portal_id : number){
    const {info, productRows} = data
    const type = productRows.productName === "Обзвон" ? ((info as IAutoInfoProduct).property308.valueEnum === "с РР" ? 2 : 1) : 3
    const response = prisma.autoinformation_module.upsert({
    where : {portal_id_bitrix_id :{
        bitrix_id : productRows.id,
        portal_id : portal_id
    }},
    create : {
        contract : {connect : {portal_id_bitrix_id : {
            bitrix_id : productRows.ownerId,
            portal_id : portal_id
        }}},
        price : productRows.price,
        autoinformation_type : {connect : {id : type}},
        quantity : 10,
        active : true,
        bitrix_id : productRows.id,
        product_id : productRows.productId,
        portal : {connect : {id : portal_id}},
        title : productRows.productName,
        tariff : {connect : {id : 1}},
    },
    update : {
        contract : {connect : {portal_id_bitrix_id : {
            bitrix_id : productRows.ownerId,
            portal_id : portal_id
        }}},
        price : productRows.price,
        quantity : 10,
        active : true,
        title : productRows.productName,
        tariff : {connect : {id : 1}},
    },
    include : {
        contract : {select : {
                company_id : true
            }}
    }
   })
   return response
}

export async function postAutoInformationProductPrisma(data : {info : ISmsProduct, productRows : IProductRow}, portal_id : number){
    const {info, productRows} = data
    const type = productRows.productName === "Обзвон" ? ((info as IAutoInfoProduct).property308.valueEnum === "с РР" ? 2 : 1) : 3
    const response = prisma.autoinformation_module.create({
        data : {
            contract : {connect : {portal_id_bitrix_id : {
                bitrix_id : productRows.ownerId,
                portal_id : portal_id
            }}},
            price : productRows.price,
            autoinformation_type : {connect : {id : type}},
            quantity : 10,
            active : true,
            bitrix_id : productRows.id,
            product_id : productRows.productId,
            portal : {connect : {id : portal_id}},
            title : info.name,
            tariff : {connect : {id : 1}},
        },
        include : {
        contract : {select : {
                company_id : true
            }}
    }
    })
    return response
}

export async function requireAutoInfo(id : number, portal_id : number){
    const response = await prisma.autoinformation_module.findFirst({where :  {id, portal_id}})
    return !!response
}