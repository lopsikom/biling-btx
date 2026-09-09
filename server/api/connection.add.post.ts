import { Connection, ConnectionPost, entityType, IConnectionPost } from "~~/shared/models/APIModels";
import { connectionPostPrisma } from "../utils/prisma/Connection";
import { connectionMapPostPrisma } from "../utils/mappers";
import { ZodError } from "zod";
import { eventsAudit, EventEntity } from "../services/EventsAudit";
import { PortalDataType } from "../utils/prisma/getPortalByUserBitrix";
import { requireRole } from "../utils/requireRole";
import { fault, refusal, zodFields } from '~~/server/utils/errors'

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
        if(e instanceof ZodError){
            const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
            throw refusal('validation.failed', 400, { message: mess, details: zodFields(e) })
        }
        else {
            throw fault('internal', { cause: e })
        }
    }

})