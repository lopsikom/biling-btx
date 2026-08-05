import z, { ZodError } from "zod"

export default defineEventHandler(async event => {
    try {
        const portal = event.context.portal
        const id = await z.number().parseAsync(getRouterParams(event).id)
        await deleteTag(id)
        return true
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