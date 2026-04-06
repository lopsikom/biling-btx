import * as z from "zod"
import { EventEntity, eventsAudit } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { ConnectionPatch, entityType } from "~~/shared/models/APIModels";


export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    const body = await readBody(event);
    if(id){
        try{
            const data = await ConnectionPatch.parseAsync(body)
            const connection = await connectionPatchPrisma(z.coerce.number().parse(id), data);
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