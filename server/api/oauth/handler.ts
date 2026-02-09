import bitrixAPI from "~~/server/services/bitrixAPI";
import getPortalPrisma from "~~/server/utils/prisma/getPortal";
import patchPortal from "~~/server/utils/prisma/patchPortal";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const code = query.code;
    const domain = query.domain;
    const server_domain = query.server_domain;
    if(code && domain && server_domain){
        try{
            const portal = await getPortalPrisma(domain.toString());
            if(!portal){
                throw createError({
                    status : 404,
                    statusText : 'Empty portal'
                })
            }
            const token = await bitrixAPI.getPortalToken(code.toString(), portal.client_id, portal.client_secret, server_domain.toString());
            console.log(token);

            patchPortal(portal.id, token.refresh_token, token.access_token)
            const data = {
                refresh : token.refresh_token,
            }
            setResponseStatus(event, 202)
            return data 
            
            
        }
        catch(e){
            console.error(e)
            throw createError({
                status : 500,
                statusText : 'Server error'
            })
        }
    }
    else{
        throw createError({
            status : 400,
            statusText: 'invalid code'
        }) 
    }
})