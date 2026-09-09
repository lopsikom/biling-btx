import * as z from "zod"
import { EventEntity, eventsAudit } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { requireConnection } from "~~/server/utils/prisma/Connection";
import { requireRole } from "~~/server/utils/requireRole";
import { ConnectionPatch, entityType } from "~~/shared/models/APIModels";
import { fault, refusal, zodFields } from '~~/server/utils/errors'


export default defineEventHandler(async (event) => {
    requireRole(event, 'manager')
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    const body = await readBody(event);
    if(id){
        try{
            const parseId = z.coerce.number().parse(id)
            const verify = await requireConnection(parseId, portal.portal.id)
            if (!verify) throw fault('tenant.violation', { statusCode: 404, message: 'Запрошен объект другого портала' })
            const data = await ConnectionPatch.parseAsync(body)
            const connection = await connectionPatchPrisma(parseId, data);
            if(!connection){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found connection"
                })
            }
            eventsAudit.emit("entity.update", {
                    userid : portal?.user_id,
                    entity : entityType.CONNECTION,
                    entityName : connection.title,
                    companyid : connection.company_id
            } as EventEntity)
            return connection
        }catch(e){
            if(e instanceof z.ZodError){
                const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
                throw refusal('validation.failed', 400, { message: mess, details: zodFields(e) })
            }
            else {
                throw fault('internal', { cause: e })
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