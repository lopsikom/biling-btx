import { useNuxtApp } from "nuxt/app";
import {PrismaPg} from "@prisma/adapter-pg"
import { PrismaClient } from "../models/generated/prisma/client";

const connectionString =  useRuntimeConfig().DatabaseUrl;

const adapter = new PrismaPg({connectionString});
const prisma = new PrismaClient({adapter});

export {prisma}