import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix"
import { getUsersPrisma } from "~~/server/utils/prisma/UserBitrix";

export default defineEventHandler(async (event) => {
    const portal = event.context.portal as PortalDataType;
    try{
        const users = await getUsersPrisma(portal!.portal.id, {
            id : true,
            name : true,
            last_name : true,
            second_name : true
        });
        return users
    }catch(e){
        console.error(e);
        throw createError({
            statusCode : 404,
            statusMessage : "invalid response"
        })
    }
})