import { useNuxtApp } from "nuxt/app"
import bitrixAPI from "../services/bitrix/bitrixAPI"
import getPortalByUserBitrix from "../utils/prisma/getPortalByUserBitrix";

export default defineEventHandler(async (event) => {
    if(!event.path.startsWith("/api")) return
    if(event.path.startsWith("/api/oauth") || event.path.startsWith("/api/test")) return
    const token = getHeader(event, "Authorization");
    if(!token){
        if(process.env.NUXT_PUBLIC_DEV){
            event.context.portal = {
                id : 4,
                client_id : "local.6992c7695033b3.26687139",
                client_secret : "9NHC5JN4QgR5nLVs6EOc3stJrhh9sbBd0dOIlk2kGiItA6RNTX",
                domain : "b24-sxsxo9.bitrix24.ru"
            };
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
        const portal = await getPortalByUserBitrix(token)
        if(!portal) throw createError({
            statusCode : 404,
            statusMessage : "Bad Auth",
            message : 'none find portal'
        })
        event.context.portal = portal;
    }catch(e){
        console.log(e);

    }
})