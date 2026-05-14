import { useNuxtApp } from "nuxt/app"
import bitrixAPI from "../services/bitrix/bitrixAPI"
import getPortalByUserBitrix, { PortalDataType } from "../utils/prisma/getPortalByUserBitrix";
import redisCheck from "../plugins/redis-check";
import { redisClient } from "../services/redis";

export default defineEventHandler(async (event) => {
    if(!event.path.startsWith("/api")) return
    if(event.path.startsWith("/api/oauth")) return
    if(event.path.startsWith("/api/bitrix/webhook")) return
    const token = getHeader(event, "Authorization");
    if(!token){
        if(process.env.NUXT_PUBLIC_DEV && process.env.NUXT_DEV_SKIP_AUTH){
            event.context.portal = {
                portal : {
                    id : Number(process.env.NUXT_DEV_PORTAL_ID),
                    client_id : process.env.NUXT_DEV_CLIENT_ID,
                    client_secret : process.env.NUXT_DEV_CLIENT_SECRET,
                    domain : process.env.NUXT_DEV_DOMAIN,  
                    refresh_token : process.env.NUXT_DEV_REFRESH_TOKEN
                },
                user_id : Number(process.env.NUXT_DEV_USER_ID),
                bitrix_user_id : process.env.NUXT_DEV_USER_BITRIX_ID
            } as PortalDataType;
            return
        }
        else{
            console.log("middleware token ", token)
            console.dir(event, { depth: null, colors: true })
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                message : 'none token'
            })
        }
    }
    try{
        const cachePortal = await redisClient.get(`token:${token}`) 
        if(cachePortal){
            event.context.portal = JSON.parse(cachePortal);
            return
        }
        const portal = await getPortalByUserBitrix(token)
        if(!portal) throw createError({
            statusCode : 404,
            statusMessage : "Unauthorized",
            message : 'none find portal'
        })
        const {client_secret, ...data} = portal.portal
        const newPortal = {portal : data, user_id : portal.user_id, bitrix_user_id : portal.bitrix_user_id}
        await redisClient.set(`token:${token}`, JSON.stringify(newPortal), "EX", 300)
        event.context.portal = newPortal;
    }catch(e){
        console.error(e);
        throw createError({
            statusCode: 500,
            statusMessage: 'Unauthorized',
            message : 'app error'
        })
    }
})