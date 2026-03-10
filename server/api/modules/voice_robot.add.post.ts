import { ZodError } from "zod";
import { voiceRobotInputMapPrisma } from "~~/server/utils/mappers";
import { postVoiceRobotPrisma } from "~~/server/utils/prisma/modules/VoiceRobot";
import { VoiceRobotPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    try{
        const ZBody = await VoiceRobotPost.transform(val => voiceRobotInputMapPrisma(val)).parse(body)
        const voice_robot = await postVoiceRobotPrisma(ZBody);
        setResponseStatus(event, 201);
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
