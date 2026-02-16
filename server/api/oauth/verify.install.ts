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
        const data = await bitrixAPI.enterHandler(portal.domain, portal.client_id); 
        //console.log('data ', data); //добавить проверку
        const sync = await syncService.installSync(portal.id);
        console.log(sync)
        return true
    }catch(e){
        console.log(e)
        throw createError({
            statusCode: 500,
            statusMessage: "Error"
        })
    }
})