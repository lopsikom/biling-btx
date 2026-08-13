import { prisma } from "~~/server/services/prisma/prismaClient";
import { tag, company_tag } from "~~/server/services/models/generated/prisma/client";
import { ITagCreatae } from "~~/shared/models/APIModels";
import { tagCreateInput } from "~~/server/services/models/generated/prisma/models";

export async function getTagslist(portal_id : number){
    const response = await prisma.tag.findMany({
        where : {
            portal_id : portal_id
        }
    })
    return response
}

export async function getCompanyTags(company_id : number) : Promise<tag[]>
export async function getCompanyTags(company_id : string, portal_id : number) : Promise<tag[]>
export async function getCompanyTags(company_id : number | string, portal_id? : number) : Promise<tag[]> {
    if(typeof company_id === "string"){
        const response = await prisma.company_tag.findMany({
            where : {
                company : {
                    portal_id : portal_id,
                    bitrix_id : company_id
                }
            },
            include :{
                tag : true
            }
        })
        return response.map(t => t.tag)
    }
    else {
        const response = await prisma.company_tag.findMany({
            where : {
                company_id : company_id
            },
            include : {
                tag : true
            }
        })
        return response.map(t => t.tag)
    }
}
export async function createTag(data : ITagCreatae[], portal_id : number) : Promise<tag[]>
export async function createTag(data : ITagCreatae, portal_id : number)  : Promise<tag> 
export async function createTag(data : ITagCreatae[] | ITagCreatae, portal_id : number) : Promise<tag | tag[]> {
    if(Array.isArray(data)){
        const response = await prisma.tag.createManyAndReturn({
        data : data.map(i => {return {...i, portal_id : portal_id}})
    })
    return response
    }
    else {
        const response = await prisma.tag.create({
            data : {
                ...data,
                portal_id
            }
        })
        return response
    }
}
export async function deleteTag (id : number) {
    await prisma.tag.delete({
        where : {
            id : id
        }
    })
}
export async function bindTagCompany(company_id : number, tag_id : number) : Promise<company_tag>
export async function bindTagCompany(company_id : string, tag_id : number, portal_id : number) : Promise<company_tag>
export async function bindTagCompany(company_id : number | string, tag_id : number, portal_id? : number) : Promise<company_tag>{
    if(typeof company_id === "string") {
        const response = await prisma.company_tag.create({
            data : {
                company : { connect: { bitrix_id_portal_id: { bitrix_id: company_id, portal_id: portal_id! } } },
                tag : {connect : {id : tag_id}}
            }
        })
        return response
    }
    else {
        const response = await prisma.company_tag.create({
            data : {
                company : {connect : {id : company_id}},
                tag : {connect : {id : tag_id}}
            }
        })
        return response;
    }
}

export async function unbindTagCompany(company_id : number, tag_id : number) {
    const response = await prisma.company_tag.delete({
        where : {
            tag_id_company_id : {tag_id, company_id}
        }
    })
    return response
}
