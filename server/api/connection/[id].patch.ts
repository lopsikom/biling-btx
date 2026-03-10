import * as z from "zod"
import { ConnectionPatch } from "~~/shared/models/APIModels";


export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
    if(id){
        try{
            const data = await ConnectionPatch.parseAsync(body)
            const connection = await connectionPatchPrisma(z.coerce.number().parse(id), data);
            if(!connection){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found connection"
                })
            }
            return connection
        }catch(e){
            console.error(e);
            if(e instanceof z.ZodError){
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
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})