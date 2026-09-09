import { EventEntity, eventsAudit } from "~~/server/services/EventsAudit";
import { connectionDeletePrisma, requireConnection } from "~~/server/utils/prisma/Connection";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { requireRole } from "~~/server/utils/requireRole";
import { entityType } from "~~/shared/models/APIModels";
import { fault } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
    requireRole(event, 'manager')
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    let parseId : number;
    if(id){
        try{
            parseId = parseInt(id);
        }catch(e){
            throw createError({
                statusCode : 400,
                statusMessage : "Invalid id"
            });
        }
        const verify = await requireConnection(parseId, portal.portal.id)
        if (!verify) throw fault('tenant.violation', { statusCode: 404, message: 'Запрошен объект другого портала' })
        const data = await connectionDeletePrisma(parseId);
        if(!data){
            return false;
        }
        eventsAudit.emit("entity.delete", {
            userid : portal?.user_id,
            entity : entityType.CONNECTION,
            entityName : data.title,
            companyid : data.company_id
        } as EventEntity)
        return true;
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})