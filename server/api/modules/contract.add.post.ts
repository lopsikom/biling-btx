import { ZodError } from "zod";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { contractInputMapPrisma } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { addContractPrisma } from "~~/server/utils/prisma/modules/Contract";
import { ContractPost, entityType } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const portal_id = event.context.portal as PortalDataType;
    const body = await readBody(event);
    try{
        const ZBody = await ContractPost.transform(val => contractInputMapPrisma(val, portal_id!.portal.id)).parseAsync(body);
        const contract = await addContractPrisma(ZBody);
        setResponseStatus(event, 201);
        eventsAudit.emit("entity.create", {
            userid : portal_id?.user_id,
            entity : entityType.CONTRACT,
            entityName : contract.name
        } as EventEntity)
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