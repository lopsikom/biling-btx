import { EventEmitter } from "node:events";
import { Bitrix24Event, IBitrixWebhookPayload, IContractBitrix, IDynamicItemEvent, NewBitrixCompany } from "./models";
import {getBitrixTokenByRedis} from "../utils/getBitrixToken"
import bitrixAPI from "./bitrix/bitrixAPI";
import { redisClient } from "./redis";
import { entityType } from "~~/shared/models/APIModels";
import { upsertContractPrisma } from "../utils/prisma/modules/Contract";
import getMyCompanysCache from "../utils/redis/getMyCompanys";
import { getAllModulesContact } from "../utils/prisma/modules";
import { reconcileContractProducts } from "./contractProductSync/reconcileContractProducts";
import { EventEntity, eventsAudit } from "./EventsAudit";
import postCompanyPrisma from "../utils/prisma/postCompany";
import { compnayMapPostPrisma } from "../utils/mappers";
import getCompanyPrisma from "../utils/prisma/getCompany";
import z from "zod";
import deleteCompanyPrisma from "../utils/prisma/deleteCompany";


export type WebHooksMap = {
    [Bitrix24Event.CRM_DYNAMIC_ITEM_ADD] : [IBitrixWebhookPayload<IDynamicItemEvent>],
    [Bitrix24Event.CRM_DYNAMIC_ITEM_DELETE] : [IBitrixWebhookPayload<IDynamicItemEvent>],
    [Bitrix24Event.CRM_DYNAMIC_ITEM_UPDATE] : [IBitrixWebhookPayload<IDynamicItemEvent>],
    [Bitrix24Event.CRM_COMPANY_ADD] : [IBitrixWebhookPayload<Omit<IDynamicItemEvent, "ENTITY_TYPE_ID">>],
    [Bitrix24Event.CRM_COMPANY_DELETE] : [IBitrixWebhookPayload<Omit<IDynamicItemEvent, "ENTITY_TYPE_ID">>]
}

const config = useRuntimeConfig()

export const CONTRACT_ID_BITRIX = config.ContractIdBitrix;
export const CONTRACT_STRING_ID_BITRIX = config.ContractStringIdBitrix

export const webHookEmmiter = new EventEmitter<WebHooksMap>() 


webHookEmmiter.on(Bitrix24Event.CRM_DYNAMIC_ITEM_ADD, async (data) => {
    if(data.data.FIELDS.ENTITY_TYPE_ID !== CONTRACT_ID_BITRIX.toString()) return
    const portal = await getPortalByUserBitrix(data.auth.access_token);
    if(!portal) return
    const locked = await redisClient.get(`lock:contract:${data.data.FIELDS.ID}_${portal.portal.id}`)
    if (locked) {
        console.log(`[webhook] пропускаем — изменение инициировано нами`)
        return
    }
    const token = await getBitrixTokenByRedis(portal);
    if(!token) return
    const contract = (await bitrixAPI.getItem<IContractBitrix>(portal.portal.domain, token.access_token, CONTRACT_ID_BITRIX, data.data.FIELDS.ID)).result.item;
    if(!contract?.companyId) {console.warn("Нету контракта или контракт без компании"); return;}
    const myCompanys = await getMyCompanysCache(portal, token.access_token)
    const company = myCompanys.find(c => c.id === contract.mycompanyId);
    const companyPrisma = await getCompanyPrisma(contract.companyId!.toString(), portal.portal.id)
    if(!companyPrisma){
        const companyBitrix = await bitrixAPI.getItem<NewBitrixCompany>(portal.portal.domain, token.access_token, 4, contract.companyId!)
        if(!companyBitrix.result.item) {console.warn("Не удалось найти компанию"); return;}
        await postCompanyPrisma(portal.portal.id, compnayMapPostPrisma(portal.portal.id, companyBitrix.result.item))
    }
    await addContractPrisma(contractInputMapPrisma(contract, portal.portal.id, company)).then(c => {
    eventsAudit.emit("entity.create", {
        userid : portal.user_id,
        entity: entityType.CONTRACT,
        entityName : c.name,
        companyid : c.company_id
    }as EventEntity)})
    await reconcileContractProducts({
        domain: portal.portal.domain,
        token: token.access_token,
        contractBitrixId: contract.id!,
        contractStringId: CONTRACT_STRING_ID_BITRIX,
        portalId: portal.portal.id,
        mode: 'create',
        userId: portal.user_id
    })
    console.log("Contract added")
})
webHookEmmiter.on(Bitrix24Event.CRM_DYNAMIC_ITEM_UPDATE, async(data) => {
    if(data.data.FIELDS.ENTITY_TYPE_ID !== CONTRACT_ID_BITRIX.toString()) return
    const portal = await getPortalByUserBitrix(data.auth.access_token);
    if(!portal) return
        const locked = await redisClient.get(`lock:contract:${data.data.FIELDS.ID}_${portal.portal.id}`)
        console.log(`lock:contract:${data.data.FIELDS.ID}_${portal.portal.id}`)
    if (locked) {
        console.log(`[webhook] пропускаем — изменение инициировано нами`)
        return
    }
    const token = await getBitrixTokenByRedis(portal);
    if(!token) return
    const contract = (await bitrixAPI.getItem<IContractBitrix>(portal.portal.domain, token.access_token, CONTRACT_ID_BITRIX, data.data.FIELDS.ID)).result.item;
    if(!contract || contract.companyId === 0) return
    const myCompanys = await getMyCompanysCache(portal, token.access_token)
    const company = myCompanys.find(c => c.id === contract.mycompanyId);
    const companyPrisma = await getCompanyPrisma(contract.companyId!.toString(), portal.portal.id)
    if(!companyPrisma){
        const companyBitrix = await bitrixAPI.getItem<NewBitrixCompany>(portal.portal.domain, token.access_token, 4, contract.companyId!)
        if(!companyBitrix.result.item) {console.warn("Не удалось найти компанию"); return;}
        await postCompanyPrisma(portal.portal.id, compnayMapPostPrisma(portal.portal.id, companyBitrix.result.item))
    }
    await upsertContractPrisma(portal.portal.id, contractInputMapPrisma(contract, portal.portal.id, company))
    await reconcileContractProducts({
        domain: portal.portal.domain,
        token: token.access_token,
        contractBitrixId: contract.id!,
        contractStringId: CONTRACT_STRING_ID_BITRIX,
        portalId: portal.portal.id,
        mode: 'reconcile',
        userId: portal.user_id
    })
    console.log("Contract updated")
})

webHookEmmiter.on(Bitrix24Event.CRM_DYNAMIC_ITEM_DELETE, async (data) => {
    if(data.data.FIELDS.ENTITY_TYPE_ID !== CONTRACT_ID_BITRIX.toString()) return
    const portal = await getPortalByUserBitrix(data.auth.access_token);
    if(!portal) return
    const token = await getBitrixTokenByRedis(portal);
    if(!token) return
    const contract = await deleteContractPrisma(Number(data.data.FIELDS.ID), portal.portal.id);
    eventsAudit.emit("entity.delete", {
        userid : portal.user_id,
        entity : entityType.CONTRACT,
        entityName : contract.name,
        companyid : contract.company_id
    })
    console.log("Contract deleted");
})

webHookEmmiter.on(Bitrix24Event.CRM_COMPANY_ADD, async (data) => {
    try{
        const portal = await getPortalByUserBitrix(data.auth.access_token);
        if(!portal) return
        const token = await getBitrixTokenByRedis(portal);
        if(!token) return
        const id = z.number().parse(data.data.FIELDS.ID);
        const company = await bitrixAPI.getCompany(id, token.access_token, portal.portal.domain)
        if(!company.result) return;
        await postCompany(portal.portal.id, ...companyMapUpsertPrisma(portal.portal.id, [], company.result.item))
    }catch(e){
        console.error("Error add company");
        console.error(e);
    }
})
webHookEmmiter.on(Bitrix24Event.CRM_COMPANY_DELETE, async (data) => {
        try{
            const portal = await getPortalByUserBitrix(data.auth.access_token);
            if(!portal) return
            const token = await getBitrixTokenByRedis(portal);
            if(!token) return
            await deleteCompanyPrisma(data.data.FIELDS.ID, portal.portal.id)
        }catch(e) {
            console.error("Error delete company");
            console.error(e)
        }
})


export function emitBitrixEvent(event: keyof WebHooksMap, payload: IBitrixWebhookPayload<any>) {
  webHookEmmiter.emit(event, payload);
}

export async function getShapshotProduct(contract_id : number, portal_id : number) {
    const key = `product-shapshot:${contract_id}_${portal_id}`
    const cached = await redisClient.get(key)
    if (cached) {
        return JSON.parse(cached) as {bitrix_id : number, portal_id : number, type : string}[]
    }
    const products = await getAllModulesContact(contract_id, portal_id)
    await saveShapshotProduct(contract_id, portal_id, products)
    return products.filter(p => p.bitrix_id && p.portal_id)
}

export async function saveShapshotProduct(contract_id : number, portal_id : number, data : {bitrix_id : number, portal_id : number, type : string}[]){
    const key = `product-shapshot:${contract_id}_${portal_id}`
    await redisClient.set(key, JSON.stringify(data), "EX", 60*60*24)
}