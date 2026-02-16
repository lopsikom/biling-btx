import { useNuxtApp } from "nuxt/app"
import bitrixAPI from "../services/bitrix/bitrixAPI"
import getPortalByUserBitrix from "../utils/prisma/getPortalByUserBitrix";

export default defineEventHandler(async (event) => {
    if(!event.path.startsWith("/api")) return
    if(event.path.startsWith("/api/oauth")) return
    const token = getHeader(event, "Authorization");
    if(!token){
        throw createError({
            statusCode: 401,
            statusMessage: 'Bad Auth',
            message : 'none token'
        })
    }
    try{
        console.log("Dadaw")
        const portal = await getPortalByUserBitrix(token)
        if(!portal) throw createError({
            statusCode : 404,
            statusMessage : "Bad Auth",
            message : 'none find portal'
        })
        event.context.portal = portal;
    }catch(e){
        console.log(e);
        throw createError({
            statusCode : 500,
            statusMessage : "Server error",
            
        })
    }
})