import z, { ZodError } from "zod";
import { getCompanyTags } from "~~/server/utils/prisma/Tag";
import { fault, refusal, zodFields } from '~~/server/utils/errors'

export default defineEventHandler(async event => {
    const portal = event.context.portal
    try{
        const id = getRouterParams(event).id;
        const parseId = z.number().parse(parseInt(id)).toString();
        const data = getCompanyTags(parseId, portal.portal.id);
        return data
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