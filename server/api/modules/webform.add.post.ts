import { webformInputUpdateMapPrisma } from "~~/server/utils/mappers";
import { postWebFormPrisma, postWebFormTypePrisma } from "~~/server/utils/prisma/modules/WebForm";
import { IWebformPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) =>{
        const body = await readBody(event) as IWebformPost;
        try{
            const webform = await postWebFormPrisma(webformInputUpdateMapPrisma(body));
            if(!webform) { setResponseStatus(event, 400); return; }
            const integrations = await postWebFormTypePrisma(webform.id, body.integrations)
            setResponseStatus(event, 201);
            return {...webform, integrations : integrations.map(i => i.webform_type.name)}
        }catch(e){
            console.error(e);
            throw createError({
                statusCode : 400,
                statusMessage : "Validation error"
            })
        }
})