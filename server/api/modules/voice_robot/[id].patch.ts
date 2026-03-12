import { voice_robotUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { voiceRobotPatchMapPrimsa } from "~~/server/utils/mappers";
import { patchVoiceRobotPrisma } from "~~/server/utils/prisma/modules/VoiceRobot";
import { entityType, VoiceRobotUpdate } from "~~/shared/models/APIModels";
import * as z from "zod"
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal;
    const body = await readBody(event);
        if(id){
            try{
                const data = await VoiceRobotUpdate.transform(val => voiceRobotPatchMapPrimsa(val)).parseAsync(body)
                const voice_robot = await patchVoiceRobotPrisma(z.coerce.number().parse(id), data);
                if(!voice_robot){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found voice robot"
                    })
                }
                eventsAudit.emit("entity.update", {
                    userid : portal?.user_id,
                    entity : entityType.VOICE_ROBOT,
                    entityName : voice_robot.title
                } as EventEntity) 
                return voice_robot
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