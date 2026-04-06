import { useNuxtApp } from "nuxt/app"
import bitrixAPI from "../services/bitrix/bitrixAPI"
import getPortalByUserBitrix, { PortalDataType } from "../utils/prisma/getPortalByUserBitrix";
import redisCheck from "../plugins/redis-check";
import { redisClient } from "../services/redis";

export default defineEventHandler(async (event) => {
    if(!event.path.startsWith("/api")) return
    if(event.path.startsWith("/api/oauth")) return
    if(event.path.startsWith("api/oauth/webhook")) return
    const token = getHeader(event, "Authorization");
    if(!token){
        if(process.env.NUXT_PUBLIC_DEV){
            event.context.portal = {
                portal : {
                    id : 4,
                    client_id : "local.6992c7695033b3.26687139",
                    client_secret : "9NHC5JN4QgR5nLVs6EOc3stJrhh9sbBd0dOIlk2kGiItA6RNTX",
                    domain : "b24-sxsxo9.bitrix24.ru",  
                    refresh_token : "b165ba690080f1620080f13200000001000007e01813a5991cec1c608fb3d43c3bd614"
                },
                user_id : 2,
                bitrix_user_id : "1"
            } as PortalDataType;
            return
        }
        else{
            throw createError({
                statusCode: 401,
                statusMessage: 'Bad Auth',
                message : 'none token'
            })
        }
    }
    try{
        console.log("middleware ", token)
        const cachePortal = await redisClient.get(`token:${token}`)
        if(cachePortal){
            console.log("cachePortal ", cachePortal)
            event.context.portal = JSON.parse(cachePortal);
            return
        }
        console.log("no cachePortal")
        const portal = await getPortalByUserBitrix(token)
        if(!portal) throw createError({
            statusCode : 404,
            statusMessage : "Bad Auth",
            message : 'none find portal'
        })
        await redisClient.set(`token:${token}`, JSON.stringify(portal), "EX", 300)
        event.context.portal = portal;
    }catch(e){
        console.log(e);

    }
})