import { redisClient } from "../services/redis"

export default defineNitroPlugin( async (nitroApp) => {
    try {
        await redisClient.ping();
        console.log("redis connected is OK")
    }catch(e){
        console.error("redis connected is failed")
        console.error(e);
        process.exit(1);
    }
})