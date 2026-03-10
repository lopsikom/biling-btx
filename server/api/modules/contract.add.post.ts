import { ZodError } from "zod";
import { contractInputMapPrisma } from "~~/server/utils/mappers";
import { addContractPrisma } from "~~/server/utils/prisma/modules/Contract";
import { ContractPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const portal_id = event.context.portal;
    const body = await readBody(event);
    try{
        const ZBody = await ContractPost.transform(val => contractInputMapPrisma(val, portal_id.id)).parseAsync(body);
        const contract = await addContractPrisma(ZBody);
        setResponseStatus(event, 201);
        return contractGetMapPrisma(contract);
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