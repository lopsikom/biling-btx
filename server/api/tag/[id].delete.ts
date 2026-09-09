import z, { ZodError } from "zod"
import { fault, refusal, zodFields } from '~~/server/utils/errors'

export default defineEventHandler(async event => {
    try {
        const portal = event.context.portal
        const id = await z.number().parseAsync(parseInt(getRouterParams(event).id))
        await deleteTag(id)
        return true
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