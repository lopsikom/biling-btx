import z, { ZodError } from "zod";
import { getCompanyTags } from "~~/server/utils/prisma/Tag";

export default defineEventHandler(async event => {
    const portal = event.context.portal
    try{
        const id = getRouterParams(event).id;
        const parseId = z.number().parse(id).toString();
        const data = getCompanyTags(parseId, portal.portal.id);
        return data
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