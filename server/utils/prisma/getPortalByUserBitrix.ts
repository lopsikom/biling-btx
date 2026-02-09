import bitrixAPI from "~~/server/services/bitrixAPI";
import getPortalPrisma from "./getPortal";


export default async function getPortalByUserBitrix(token : string){
        const data = await bitrixAPI.getPortalData(token);
        const {client_id, install} = data.result;
        const portal = await getPortalPrisma(install.domain, client_id);
        return portal
}