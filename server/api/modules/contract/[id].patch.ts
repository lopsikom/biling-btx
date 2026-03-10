import { contractUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { contractUpdateMapPrisma } from "~~/server/utils/mappers";
import { patchContractPrisma } from "~~/server/utils/prisma/modules/Contract";
import * as z from "zod"
import { ContractUpdate } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
        if(id){
            try{
                const data = await ContractUpdate.transform(val => contractUpdateMapPrisma(val)).parseAsync(body)
                const contract = await patchContractPrisma(z.coerce.number().parse(id), data);
                if(!contract){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found contract"
                    })
                }
                return contractGetMapPrisma(contract);
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