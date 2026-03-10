import { ZodError } from "zod";
import { vatsInputMapPrisma } from "~~/server/utils/mappers";
import { postVatsPrisma } from "~~/server/utils/prisma/modules/Vats";
import { VatsPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    try{
        const Zbody = await VatsPost.transform(val => vatsInputMapPrisma(val)).parseAsync(body)
        const vats = await postVatsPrisma(Zbody);
        setResponseStatus(event, 201);
        return vats
    }catch(e){
        console.error(e);
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
