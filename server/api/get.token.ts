import getPortalPrisma from "../utils/prisma/getPortal";

export default defineEventHandler(async (event) => {
    const portal_id = event.context.portal;
    if(!portal_id){
        throw createError({
            statusCode : 401,
            statusMessage : 'Bad Auth'
        })
    }
    const data = await getBitrixTokenByPortal(portal_id.id)
    return data;
})