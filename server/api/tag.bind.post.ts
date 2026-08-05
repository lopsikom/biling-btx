import { TagBind } from "~~/shared/models/APIModels";
import { bindTagCompany } from "../utils/prisma/Tag";
import { ZodError } from "zod";

export default defineEventHandler(async (event) => {
    try {
        const portal = event.context.portal;
        const body = await TagBind.parseAsync(await readBody(event))
        let response
        if(typeof body.company_id === "string")response = await bindTagCompany(body.company_id, body.tag_id, portal.portal.id)
        else response = await bindTagCompany(body.company_id, body.tag_id)
        return response;
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