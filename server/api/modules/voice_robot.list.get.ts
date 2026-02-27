import { portal } from "~~/server/services/models/generated/prisma/client";
import { getVoiceRobotListPrisma } from "~~/server/utils/prisma/getVoiceRobot";
import { IVoiceRobotFilter } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const portal = event.context.portal as portal
        if(!portal) {
            throw createError({
                statusCode: 401
            })
        }
        const query = getQuery(event);
        let filter : IVoiceRobotFilter | undefined = undefined;
        if(query.filter){
            try{
                filter = JSON.parse(query.filter as string)
            }catch(e){
                console.warn("Невалидный filter JSON", query.filter)
            }
        }
        const data = await getVoiceRobotListPrisma({portal_id : portal.id, filter : filter})
        return data
})