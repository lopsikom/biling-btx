import { EventEntity, eventsAudit } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { deleteAutoInforPrisma } from "~~/server/utils/prisma/modules/AutoInfo";
import { entityType } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
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
        const autoinformation = await deleteAutoInforPrisma(parseId);
        if(!autoinformation){
            return false;
        }
        eventsAudit.emit("entity.delete", {
            userid : portal?.user_id,
            entity : entityType.AUTOINFORMATION,
            entityName : autoinformation.title,
            companyid : autoinformation.contract?.company_id
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