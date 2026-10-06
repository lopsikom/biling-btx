import bitrixAPI from "../services/bitrix/bitrixAPI";
import getPortalPrisma from "./prisma/getPortal";
import type {PortalDataType} from "./prisma/getPortalByUserBitrix"
import {redisClient} from "../services/redis"
import {IBitrixToken} from "../services/models"
import { prisma } from "../services/prisma/prismaClient";


export async function getBitrixTokenByCode(code : string, server_domain : string, state : number){
    const portal = await getPortalPrisma({
        id : state
    });
        if(!portal){
            throw createError({
                status : 404,
                statusText : 'Empty portal'
            })
        }
        const token = await bitrixAPI.getPortalToken(code.toString(), portal.client_id, portal.client_secret, server_domain.toString());
        await patchPortal(portal.id, token.refresh_token, token.access_token)
        const data = {
            accessToken : token.access_token,
            refresh : token.refresh_token,
        }
        return data 
}

export async function getBitrixTokenByPortal(portal_id : number){
    const portal = await getPortalPrisma({
        id : portal_id
    });
    return portal
}

export async function getBitrixTokenByRefresh(portal_id : number){
    const portal = await getPortalPrisma({
        id : portal_id
    })
    if(!portal || !portal.refresh_token)return;
    const token = await bitrixAPI.getAccesToken(portal.client_id, portal.client_secret, portal.refresh_token)
    updateBitrixTokenForDB(portal_id, token.access_token, token.refresh_token)
    return { 
        accessToken : token.access_token,
        refresh : token.refresh_token
    } 
}

export async function updateBitrixTokenForDB(portal_id : number, access_token : string, refresh_token : string){
    const response = prisma.portal.update({
        where : {id : portal_id},
        data : {access_token, refresh_token}
    })
    return response;
}

export async function getBitrixTokenByRedis(portal : PortalDataType){
    if(!portal || !portal.portal.refresh_token) return
    const parseToken = await redisClient.get(`token:${portal.portal.id}`)
    if(parseToken) return JSON.parse(parseToken) as IBitrixToken
    const newPortal = await getPortalPrisma({id : portal.portal.id})
    if(!newPortal || !newPortal.refresh_token) return
    const token = await bitrixAPI.getAccesToken(newPortal.client_id, newPortal.client_secret, newPortal.refresh_token);
    updateBitrixTokenForDB(portal.portal.id, token.access_token, token.refresh_token)
    if(!token) return
    redisClient.set(`token:${portal.portal.id}`, JSON.stringify(token), "EX", 3000)
    return token
}

export type bitrixTokens = ReturnType<typeof getBitrixTokenByCode>



