import { autoinformation_moduleUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { patchAutoinfromationPrisma } from "~~/server/utils/prisma/modules/AutoInfo";
import * as z from "zod"
import { AutoInformationFilterUpdate, entityType } from "~~/shared/models/APIModels";
import { EventEntity, eventsAudit } from "~~/server/services/EventsAudit";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal;
    const body = await readBody(event);
    if(id){
        try{
            const data = await AutoInformationFilterUpdate.transform(val => autoinformationInputMapPrisma(val)).parseAsync(body)
            const autoinformation = await patchAutoinfromationPrisma(z.coerce.number().parse(id), data);
            if(!autoinformation){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found autoinformation module"
                })
            }
            eventsAudit.emit("entity.update", {
                userid : portal?.user_id,
                entity : entityType.AUTOINFORMATION,
                entityName : autoinformation.title
            } as EventEntity)
            return autoinformation;
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