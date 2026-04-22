import { prisma } from "~~/server/services/prisma/prismaClient"
import { ProductEnum } from "~~/shared/models/bitrixModels"

export * from "./AutoInfo"
export * from "./ChatBot"
export * from "./Contract"
export * from "./Vats"
export * from "./VoiceRobot"
export * from "./WebForm"

export async function getAllModulesContact(id : number, portal_id : number) : Promise<{ id: number; type: string }[]>
export async function getAllModulesContact(id : number) : Promise<{ id: number; type: string }[]>
export async function getAllModulesContact(id : number, portal_id? : number) : Promise<{ id: number; type: string }[]> {
    if(portal_id){
        const [chat_bots, vats, voice_robots, autoinformation_modules, webforms] = await Promise.all([
            prisma.chat_bot.findMany({where : {bitrix_id : id, portal_id : portal_id}}),
            prisma.vats.findMany({where : {bitrix_id : id, portal_id : portal_id}}),
            prisma.voice_robot.findMany({where : {bitrix_id : id, portal_id : portal_id}}),
            prisma.autoinformation_module.findMany({where : {bitrix_id : id, portal_id : portal_id}}),
            prisma.webform.findMany({where : {bitrix_id : id, portal_id : portal_id}})
        ])
        return [
            ...chat_bots.map(m => {return {id : m.id, type : ProductEnum.CHAT_BOT}}),
            ...vats.map(v => {return {id : v.id, type : ProductEnum.VATS}}),
            ...voice_robots.map(v => {return {id : v.id, type : ProductEnum.VOICE_ROBOT}}),
            ...autoinformation_modules.map(a => {return {id : a.id, type : a.type_id === 3 ? ProductEnum.SMS : ProductEnum.AUTOINFO}}),
            ...webforms.map(w => {return {id : w.id, type : ProductEnum.WEB_FORM}})
        ]
    }
    else{
        const [chat_bots, vats, voice_robots, autoinformation_modules, webforms] = await Promise.all([
            prisma.chat_bot.findMany({where : {id : id}}),
            prisma.vats.findMany({where : {id : id}}),
            prisma.voice_robot.findMany({where : {id : id}}),
            prisma.autoinformation_module.findMany({where : {id : id}}),
            prisma.webform.findMany({where : {id : id}})
        ])
        return [
            ...chat_bots.map(m => {return {id : m.id, type : ProductEnum.CHAT_BOT}}),
            ...vats.map(v => {return {id : v.id, type : ProductEnum.VATS}}),
            ...voice_robots.map(v => {return {id : v.id, type : ProductEnum.VOICE_ROBOT}}),
            ...autoinformation_modules.map(a => {return {id : a.id, type : a.type_id === 3 ? ProductEnum.SMS : ProductEnum.AUTOINFO}}),
            ...webforms.map(w => {return {id : w.id, type : ProductEnum.WEB_FORM}})
        ]
    }
}