import { webform_webform_typeCreateManyInput, webformCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { getWebformTypeWebformPrisma } from "./getWebform";

export async function postWebFormPrisma(data : webformCreateInput){
    const response = prisma.webform.create({
        data : data
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