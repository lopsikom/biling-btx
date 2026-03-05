import { prisma } from "../services/prisma/prismaClient"
import syncService from "../services/syncService";

export default defineNitroPlugin(async (nitroApp) => {
    try {
        const portals = await getPortalsPrisma();
        const portalsRecord : Record<string, number> ={}
        portals.forEach(p => {
            portalsRecord[p.domain] = p.id
        })
        syncService.setPortals = portalsRecord;
        console.log("Init syncService")
    }catch(e){
        console.error(e);
        process.exit(1);
    }
})
