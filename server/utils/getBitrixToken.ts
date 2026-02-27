import bitrixAPI from "../services/bitrix/bitrixAPI";
import getPortalPrisma from "./prisma/getPortal";


export async function getBitrixTokenByCode(code : string, domain : string, server_domain : string){
    console.log("dawdawdwad")
    const portal = await getPortalPrisma({
        domain : domain.toString()
    });
    console.log(portal)
        if(!portal){
            throw createError({
                status : 404,
                statusText : 'Empty portal'
            })
        }
        const token = await bitrixAPI.getPortalToken(code.toString(), portal.client_id, portal.client_secret, server_domain.toString());
        patchPortal(portal.id, token.refresh_token, token.access_token)
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
    if(!portal) return;
    const data = await bitrixAPI.enterHandler(portal.domain, portal.client_id);
    return data
}

export async function getBitrixTokenByRefresh(portal_id : number){
    const portal = await getPortalPrisma({
        id : portal_id
    })
    if(!portal || !portal.refresh_token)return;
    const token = await bitrixAPI.getAccesToken(portal.client_id, portal.client_secret, portal.refresh_token)
    return {
        acessToken : token.access_token,
        refresh : token.refresh_token
    } 
}


export type bitrixTokens = ReturnType<typeof getBitrixTokenByCode>



