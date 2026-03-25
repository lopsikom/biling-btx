import Redis from "ioredis";
import { useNuxtApp } from "nuxt/app";


const config = useRuntimeConfig()
console.log(config.RedisPort);
console.log(config.RedisUrl);
export const redisClient = new Redis({
    port : Number(config.RedisPort),
    host : config.RedisUrl
});
