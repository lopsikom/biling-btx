import { voice_robotUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { voiceRobotPatchMapPrimsa } from "~~/server/utils/mappers";
import patchVoiceRobotPrisma from "~~/server/utils/prisma/patchVoiceRobot";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const body = await readBody(event);
        let parseId : number;
        let data : voice_robotUpdateInput;
        if(id){
            try{
                parseId = parseInt(id);
                data = voiceRobotPatchMapPrimsa(body);
            }catch(e){
                console.error(e);
                throw createError({
                    statusCode : 400,
                    statusMessage : "Invalid id"
                });
            }
            const vats = await patchVoiceRobotPrisma(parseId, data);
                if(!vats){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found vats"
                    })
                }
                return vats
        }
        else{
            throw createError({
                statusCode : 404,
                statusMessage : "none id"
            })
        }
})