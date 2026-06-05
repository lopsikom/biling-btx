import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getVoiceRobotByIdPrisma, requireVoiceRobot } from "~~/server/utils/prisma/modules/VoiceRobot";

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
        const verify = await requireVoiceRobot(parseId, portal.portal.id)
        if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
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