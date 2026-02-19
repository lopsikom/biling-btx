import { contractInputMapPrisma } from "~~/server/utils/mappers";
import addContractPrisma from "~~/server/utils/prisma/postContract";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    try{
        const contract = await addContractPrisma(contractInputMapPrisma(body));
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