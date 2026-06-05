import bitrixAPI from "~~/server/services/bitrix/bitrixAPI";
import syncService from "~~/server/services/syncService";
import getPortalByUserBitrix from "~~/server/utils/prisma/getPortalByUserBitrix";

export default defineEventHandler(async (event) =>{
    const token = getHeader(event, "Authorization");
    if(!token){
        throw createError({
            statusCode: 401,
            statusMessage: 'Empty token'
        })
    }
    try{
        const portal = await getPortalByUserBitrix(token);
        if(!portal){
            return false
        }
        if(!portal.portal.refresh_token) {
            return false
        }
        const sync = await syncService.installSync(portal.portal.id);
        if(!sync) return false
        return true
    }catch(e){
        console.error(e)
        throw createError({
            statusCode: 500,
            statusMessage: "Error"
        })
    }
})