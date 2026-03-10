import { chat_botUpdateInput, webformUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { webformInputUpdateMapPrisma } from "~~/server/utils/mappers";
import { patchWebformPrisma } from "~~/server/utils/prisma/modules/WebForm";
import { WebFormFilterUpdate } from "~~/shared/models/APIModels";
import * as z from "zod"

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
    if(id){
        try{
            const data =  WebFormFilterUpdate.transform(val => webformInputUpdateMapPrisma(val)).parse(body)
            const webForm = await patchWebformPrisma(z.coerce.number().parse(id), data, z.array(z.number()).parse(body.integrations ?? []));
            if(!webForm){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found webForm"
                })
            }
            return webformGetMapPrisma(webForm);
        }catch(e){
            console.error(e);
            if(e instanceof z.ZodError){
                console.error(e.issues);
                const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
                throw createError({
                    statusCode : 400,
                    statusMessage : "Vallidation Error",
                    message : mess
                })
            }
            else {
                throw createError({
                    statusCode: 500,
                    statusMessage : "Server Error"
                })
            }
        }
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
}) 