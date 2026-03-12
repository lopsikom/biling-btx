import { EventEntity, eventsAudit } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { deleteVatsPrisma } from "~~/server/utils/prisma/modules/Vats";
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
        const data = await deleteVatsPrisma(parseId);
        if(!data){
            return false;
        }
        eventsAudit.emit("entity.delete", {
            userid : portal?.user_id,
            entity : entityType.VATS,
            entityName : data.title
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