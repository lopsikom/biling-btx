import { chat_botUpdateInput, webformUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { webformInputUpdateMapPrisma } from "~~/server/utils/mappers";
import { patchWebformPrisma } from "~~/server/utils/prisma/modules/WebForm";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
    let parseId : number;
    let data : webformUpdateInput;
    if(id){
        try{
            parseId = parseInt(id);
            data = webformInputUpdateMapPrisma(body);
        }catch(e){
            console.error(e);
            throw createError({
                statusCode : 400,
                statusMessage : "Invalid id"
            });
        }
        const webform = await patchWebformPrisma(parseId, data, body.integrations);
            if(!webform){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found contract"
                })
            }
            return webformGetMapPrisma(webform);
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
}) 