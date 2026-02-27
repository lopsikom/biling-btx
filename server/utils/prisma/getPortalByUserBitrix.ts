import bitrixAPI from "~~/server/services/bitrix/bitrixAPI";
import getPortalPrisma from "./getPortal";

export default async function getPortalByUserBitrix(token : string){
        const data = await bitrixAPI.getPortalData(token);
        const {client_id, install} = data.result;
        const portal = await getPortalPrisma({ // Добавить проверку на код приложения
                domain : install.domain,
                client_id : client_id
        });
        return portal
}
export type PortalType = Awaited<ReturnType<typeof getPortalByUserBitrix>>