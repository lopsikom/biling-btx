import { prisma } from "../services/prisma/prismaClient"

export default defineNitroPlugin(async (nitroApp) =>{
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        console.log('Prisma connected is OK')
    }catch(e){
        console.error('Prisma connected is failed');
        console.error(e);
        process.exit(1);
    }
})