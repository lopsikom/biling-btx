import { contractInputMapPrisma } from "~~/server/utils/mappers";
import addContractPrisma from "~~/server/utils/prisma/postContract";

export default defineEventHandler(async (event) => {
    const portal_id = event.context.portal;
    const body = await readBody(event);
    try{
        const contract = await addContractPrisma(contractInputMapPrisma(body, portal_id.id));
        setResponseStatus(event, 201);
        return contractGetMapPrisma(contract);
    }catch(e){
        console.error(e);
        throw createError({
            statusCode : 400,
            statusMessage : "Validation error"
        })
    }

})