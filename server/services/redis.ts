import Redis from "ioredis";
import { useNuxtApp } from "nuxt/app";


const config = useRuntimeConfig()
export const redisClient = new Redis({
    port : Number(config.RedisPort),
    host : config.RedisUrl
});
