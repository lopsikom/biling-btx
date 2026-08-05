import { TagCreate } from "~~/shared/models/APIModels"
import { PortalDataType } from "../utils/prisma/getPortalByUserBitrix"
import { createTag } from "../utils/prisma/Tag";
import { ZodError } from "zod";

export default defineEventHandler(async (event) => {
    try {
        const portal = event.context.portal
        const body = await TagCreate.parseAsync(await readBody(event));
        const response = await createTag(body, portal.portal.id)
        return response
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