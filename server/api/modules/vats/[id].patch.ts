import { ZodError } from "zod";
import { vatsUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { patchVatsPrisma } from "~~/server/utils/prisma/modules/Vats";
import { entityType, VatsUpdate } from "~~/shared/models/APIModels";
import * as z from "zod"
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal;
    const body = await readBody(event);
        if(id){
            try{
                const data = await VatsUpdate.transform(val => vatsUpdateMapPrisma(val)).parseAsync(body)
                const vats = await patchVatsPrisma(z.coerce.number().parse(id), data);
                if(!vats){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found vats"
                    })
                }
                eventsAudit.emit("entity.update", {
                    userid : portal?.user_id,
                    entity : entityType.VATS,
                    entityName : vats.title,
                    companyid : vats.contract?.company_id
                } as EventEntity)
                return vats
            }catch(e){
                console.error(e);
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
        }
        else{
            throw createError({
                statusCode : 404,
                statusMessage : "none id"
            })
        }
})