import { ZodError } from "zod";
import { webformInputUpdateMapPrisma } from "~~/server/utils/mappers";
import { postWebFormPrisma, postWebFormTypePrisma } from "~~/server/utils/prisma/modules/WebForm";
import { IWebformPost, WebFormPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) =>{
        const body = await readBody(event) as IWebformPost;
        try{
            const ZBody = await WebFormPost.transform(val => webformInputUpdateMapPrisma(val)).parseAsync(body)
            const webform = await postWebFormPrisma(ZBody);
            if(!webform) { setResponseStatus(event, 400); return; }
            const integrations = await postWebFormTypePrisma(webform.id, body.integrations)
            setResponseStatus(event, 201);
            return {...webform, integrations : integrations.map(i => i.webform_type.name)}
        }catch(e){
            console.error(e)
            if(e instanceof ZodError){
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
})