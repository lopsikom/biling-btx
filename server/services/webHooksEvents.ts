import { EventEmitter } from "node:events";
import { Bitrix24Event, IBitrixWebhookPayload, ICompanyNew, IContractBitrix, IDynamicItemEvent } from "./models";
import {getBitrixTokenByRedis} from "../utils/getBitrixToken"
import bitrixAPI from "./bitrix/bitrixAPI";
import { redisClient } from "./redis";
import { ICacheCompany } from "~~/shared/models/APIModels";
import { upsertContractPrisma } from "../utils/prisma/modules/Contract";


export type WebHooksMap = {
    [Bitrix24Event.CRM_DYNAMIC_ITEM_ADD] : [IBitrixWebhookPayload<IDynamicItemEvent>],
    [Bitrix24Event.CRM_DYNAMIC_ITEM_DELETE] : [IBitrixWebhookPayload<IDynamicItemEvent>],
    [Bitrix24Event.CRM_DYNAMIC_ITEM_UPDATE] : [IBitrixWebhookPayload<IDynamicItemEvent>]
}

const config = useRuntimeConfig()

export const CONTRACT_ID_BITRIX = config.ContractIdBitrix; 

export const webHookEmmiter = new EventEmitter<WebHooksMap>() 


webHookEmmiter.on(Bitrix24Event.CRM_DYNAMIC_ITEM_ADD, async (data) => {
    if(data.data.FIELDS.ENTITY_TYPE_ID !== CONTRACT_ID_BITRIX.toString()) return
    const portal = await getPortalByUserBitrix(data.auth.access_token);
    if(!portal) return
    const token = await getBitrixTokenByRedis(portal);
    if(!token) return
    const contract = (await bitrixAPI.getItem<IContractBitrix>(portal.portal.domain, token.access_token, CONTRACT_ID_BITRIX.toString(), data.data.FIELDS.ID)).result.item;
    if(!contract) return
    const myCompanyCache = await redisClient.get("myCompanyBitrix")
    let myCompany : ICacheCompany[]
    if(!myCompanyCache){
        const myCompanys = (await bitrixAPI.getItems<ICompanyNew[]>(portal.portal.domain, token.access_token, "4", {
            "isMyCompany" : "Y"
        })).result.items
        const cache = myCompanys.map(c => {return {id : c.id, title : c.title} as ICacheCompany})
        await redisClient.set("myCompanyBitrix", JSON.stringify(cache));
        myCompany = cache
    }
    else myCompany = JSON.parse(myCompanyCache) as ICacheCompany[]
    const company = myCompany.find(c => c.id === contract.mycompanyId);
    await addContractPrisma(contractInputMapPrisma(contract, portal.portal.id, company))
    console.log("Contract added")
})
webHookEmmiter.on(Bitrix24Event.CRM_DYNAMIC_ITEM_UPDATE, async(data) => {
    if(data.data.FIELDS.ENTITY_TYPE_ID !== CONTRACT_ID_BITRIX.toString()) return
    const portal = await getPortalByUserBitrix(data.auth.access_token);
    if(!portal) return
    const token = await getBitrixTokenByRedis(portal);
    if(!token) return
    const contract = (await bitrixAPI.getItem<IContractBitrix>(portal.portal.domain, token.access_token, CONTRACT_ID_BITRIX.toString(), data.data.FIELDS.ID)).result.item;
    if(!contract || contract.companyId === 0) return
    const myCompanyCache = await redisClient.get("myCompanyBitrix")
    let myCompany : ICacheCompany[]
    if(!myCompanyCache){
        const myCompanys = (await bitrixAPI.getItems<ICompanyNew[]>(portal.portal.domain, token.access_token, "4", {
            "isMyCompany" : "Y"
        })).result.items
        const cache = myCompanys.map(c => {return {id : c.id, title : c.title} as ICacheCompany})
        await redisClient.set("myCompanyBitrix", JSON.stringify(cache));
        myCompany = cache
    }
    else myCompany = JSON.parse(myCompanyCache) as ICacheCompany[]
    const company = myCompany.find(c => c.id === contract.mycompanyId);
    await upsertContractPrisma(portal.portal.id, contractInputMapPrisma(contract, portal.portal.id, company))
    console.log("Contract updated")
})

webHookEmmiter.on(Bitrix24Event.CRM_DYNAMIC_ITEM_DELETE, async (data) => {
    if(data.data.FIELDS.ENTITY_TYPE_ID !== CONTRACT_ID_BITRIX.toString()) return
    const portal = await getPortalByUserBitrix(data.auth.access_token);
    if(!portal) return
    const token = await getBitrixTokenByRedis(portal);
    if(!token) return
    await deleteContractPrisma(Number(data.data.FIELDS.ID), portal.portal.id);
    console.log("Contract deleted");
})

export function emitBitrixEvent(event: keyof WebHooksMap, payload: IBitrixWebhookPayload<any>) {
  webHookEmmiter.emit(event, payload);
}