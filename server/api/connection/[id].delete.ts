import { connectionDeletePrisma } from "~~/server/utils/prisma/Connection";
import deleteContractPrisma from "~~/server/utils/prisma/deleteContract";
import deleteVatsPrisma from "~~/server/utils/prisma/deleteVats";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    let parseId : number;
    if(id){
        try{
            parseId = parseInt(id);
        }catch(e){
            console.error(e);
            throw createError({
                statusCode : 400,
                statusMessage : "Invalid id"
            });
        }
        const data = await connectionDeletePrisma(parseId);
            if(!data){
                return false;
            }
            return true;
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})