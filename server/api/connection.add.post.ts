import { Connection, ConnectionPost, entityType, IConnectionPost } from "~~/shared/models/APIModels";
import { connectionPostPrisma } from "../utils/prisma/Connection";
import { connectionMapPostPrisma } from "../utils/mappers";
import { ZodError } from "zod";
import { eventsAudit, EventEntity } from "../services/EventsAudit";
import { PortalDataType } from "../utils/prisma/getPortalByUserBitrix";
import { requireRole } from "../utils/requireRole";

export default defineEventHandler(async (event) => {
    requireRole(event, 'manager')
    try{
        const portal_id = event.context.portal as PortalDataType;
        const body = await ConnectionPost.transform(val => connectionMapPostPrisma(val, portal_id!.portal.id)).parseAsync(await readBody(event))
        const data = await connectionPostPrisma(body)
        eventsAudit.emit("entity.create", {
            userid : portal_id?.user_id,
            entity : entityType.CONNECTION,
            entityName : data.title,
            companyid : data.company_id
        } as EventEntity) 
        setResponseStatus(event, 201);
        return data

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