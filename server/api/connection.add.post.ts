import { Connection, ConnectionPost, IConnectionPost } from "~~/shared/models/APIModels";
import { connectionPostPrisma } from "../utils/prisma/Connection";
import { connectionMapPostPrisma } from "../utils/mappers";
import { ZodError } from "zod";

export default defineEventHandler(async (event) => {
    try{
        const portal_id = event.context.portal;
        const body = await ConnectionPost.transform(val => connectionMapPostPrisma(val, portal_id.id)).parseAsync(await readBody(event))
        const data = await connectionPostPrisma(body)
        setResponseStatus(event, 201);
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