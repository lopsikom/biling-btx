import { getVoiceRobotByIdPrisma } from "~~/server/utils/prisma/modules/VoiceRobot";

export default defineEventHandler(async (event) => {
     const id = getRouterParams(event).id;
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
        const robot = await getVoiceRobotByIdPrisma(parseId);
            if(!robot){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found robot"
                })
            }
            return robot;
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})