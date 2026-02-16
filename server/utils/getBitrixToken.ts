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
        console.log(token)
        patchPortal(portal.id, token.refresh_token, token.access_token)
        const data = {
            accessToken : token.access_token,
            refresh : token.refresh_token,
        }
        return data 
}

export async function getBitrixTokenByPortal(portal_id : number){
    console.log("adad")
    const portal = await getPortalPrisma({
        id : portal_id
    });
    if(!portal) return;
    console.log(portal)
    const data = await bitrixAPI.enterHandler(portal.domain, portal.client_id);
    return data
}


export type bitrixTokens = ReturnType<typeof getBitrixTokenByCode>



