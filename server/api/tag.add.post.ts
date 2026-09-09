import { TagCreate } from "~~/shared/models/APIModels"
import { PortalDataType } from "../utils/prisma/getPortalByUserBitrix"
import { createTag } from "../utils/prisma/Tag";
import { ZodError } from "zod";
import { fault, refusal, zodFields } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
    try {
        const portal = event.context.portal
        const body = await TagCreate.parseAsync(await readBody(event));
        const response = await createTag(body, portal.portal.id)
        return response
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