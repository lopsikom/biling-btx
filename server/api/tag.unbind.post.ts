import { TagUnBind } from "~~/shared/models/APIModels";
import { unbindTagCompany } from "../utils/prisma/Tag";
import { ZodError } from "zod";
import { fault, refusal, zodFields } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
    try {
        const portal = event.context.portal;
        const body = await TagUnBind.parseAsync(await readBody(event))
        console.log(body)
        if(typeof body.company_id === "string") {
            const company = (await getCompany(body.company_id, portal.portal.id));
            if(!company) throw createError({
                    statusCode : 404,
                    statusMessage : "Not Company",
                })
            body.company_id = company.id;
        }
        await unbindTagCompany(body.company_id, body.tag_id)
        return true;
    }catch(e){
            if(e instanceof ZodError){
                const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
                throw refusal('validation.failed', 400, { message: mess, details: zodFields(e) })
            }
            else {
                throw fault('internal', { cause: e })
            }
        }
})