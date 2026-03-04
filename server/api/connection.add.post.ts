import { IConnectionPost } from "~~/shared/models/APIModels";
import { connectionPostPrisma } from "../utils/prisma/Connection";
import { connectionMapPostPrisma } from "../utils/mappers";

export default defineEventHandler(async (event) => {
    try{
        const portal_id = event.context.portal;
        const body = await readBody(event) as IConnectionPost;
        const data = await connectionPostPrisma(connectionMapPostPrisma(body,portal_id.id))
        setResponseStatus(event, 201);
        return data

    }catch(e){
        console.error(e)
        throw createError({
            statusCode : 400,
            statusMessage : "Validation error"
        }) 
    }

})