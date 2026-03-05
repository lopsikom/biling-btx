import { vatsInputMapPrisma } from "~~/server/utils/mappers";
import { postVatsPrisma } from "~~/server/utils/prisma/modules/Vats";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    try{
        const vats = await postVatsPrisma(vatsInputMapPrisma(body));
        setResponseStatus(event, 201);
        return vats
    }catch(e){
        console.error(e);
        throw createError({
            statusCode : 400,
            statusMessage : "Validation error"
        })
    }
})
