import { voiceRobotInputMapPrisma } from "~~/server/utils/mappers";
import postVoiceRobotPrisma from "~~/server/utils/prisma/postVoiceRobot";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    try{
        const vats = await postVoiceRobotPrisma(voiceRobotInputMapPrisma(body));
        setResponseStatus(event, 201);
        return vats
    }catch(e){
        console.error(e);
        throw createError({
            statusCode : 400,
            statusMessage : "Validation error"
        })
    }
})
