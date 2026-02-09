import { useNuxtApp } from "nuxt/app"
import bitrixAPI from "../services/bitrixAPI"
import getPortalPrisma from "../utils/prisma/getPortal";
import getPortalByUserBitrix from "../utils/prisma/getPortalByUserBitrix";

export default defineEventHandler(async (event) => {
    if(!event.path.startsWith("/api")) return
    if(event.path.startsWith("/api/oauth")) return
    const token = getHeader(event, "Authorization");
    if(!token){
        throw createError({
            statusCode: 401,
            statusMessage: 'Empty token'
        })
    }
    try{
        const portal = await getPortalByUserBitrix(token)
        if(!portal) throw createError({
            statusCode : 404,
            statusMessage : "Not portal"
        })
        event.context.portal = portal;
    }catch(e){
        throw createError({
            statusCode : 401,
            statusMessage : "Bad Auth"
        })
    }
})