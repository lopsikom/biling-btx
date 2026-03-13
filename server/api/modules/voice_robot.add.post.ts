import { ZodError } from "zod";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { voiceRobotInputMapPrisma } from "~~/server/utils/mappers";
import { postVoiceRobotPrisma } from "~~/server/utils/prisma/modules/VoiceRobot";
import { entityType, VoiceRobotPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const portal = event.context.portal;
    try{
        const ZBody = await VoiceRobotPost.transform(val => voiceRobotInputMapPrisma(val)).parse(body)
        const voice_robot = await postVoiceRobotPrisma(ZBody);
        setResponseStatus(event, 201);
        eventsAudit.emit("entity.create", {
            userid : portal?.user_id,
            entity : entityType.CONTRACT,
            entityName : voice_robot.title,
            companyid : voice_robot.contract?.company_id
        } as EventEntity)
        return voice_robot
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
})
