import { TagBind } from "~~/shared/models/APIModels";
import { bindTagCompany } from "../utils/prisma/Tag";
import { ZodError } from "zod";
import { fault, refusal, zodFields } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
    try {
        const portal = event.context.portal;
        const body = await TagBind.parseAsync(await readBody(event))
        let response
        if(typeof body.company_id === "string")response = await bindTagCompany(body.company_id, body.tag_id, portal.portal.id)
        else response = await bindTagCompany(body.company_id, body.tag_id)
        return response;
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