import { contractUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { contractUpdateMapPrisma } from "~~/server/utils/mappers";
import patchContractPrisma from "~~/server/utils/prisma/patchContract";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
        let parseId : number;
        let data : contractUpdateInput;
        if(id){
            try{
                parseId = parseInt(id);
                data = contractUpdateMapPrisma(body);
            }catch(e){
                console.error(e);
                throw createError({
                    statusCode : 400,
                    statusMessage : "Invalid id"
                });
            }
            const contract = await patchContractPrisma(parseId, data);
            console.log(contract)
                if(!contract){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found contract"
                    })
                }
                return contractGetMapPrisma(contract);
        }
        else{
            throw createError({
                statusCode : 404,
                statusMessage : "none id"
            })
        }
})