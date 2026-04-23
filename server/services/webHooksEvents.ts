import { EventEmitter } from "node:events";
import { AnyProduct, Bitrix24Event, IAutoInfoProduct, IBitrixWebhookPayload, IChatBotProduct, ICompanyNew, IContractBitrix, IDynamicItemEvent, IProductRow, ISmsProduct, IVatsProduct, IVoiceRobotProduct, IWebFormProdruct, ProductEnum } from "./models";
import {getBitrixTokenByRedis} from "../utils/getBitrixToken"
import bitrixAPI from "./bitrix/bitrixAPI";
import { redisClient } from "./redis";
import { ICacheCompany } from "~~/shared/models/APIModels";
import { upsertContractPrisma } from "../utils/prisma/modules/Contract";
import getMyCompanysCache from "../utils/redis/getMyCompanys";
import { postChatBotProductPrisma, upsertChatBotProductPrisma } from "../utils/prisma/modules/ChatBot";
import { postVoiceRobotProductPrisma, upsertVoiceRobotProductPrisma } from "../utils/prisma/modules/VoiceRobot";
import { postVatsProductPrisma, upsertVatsProductPrisma } from "../utils/prisma/modules/Vats";
import { postWebFormProducPrisma, upsertWebFormProductPrisma } from "../utils/prisma/modules/WebForm";
import { postAutoInformationProductPrisma, upsertAutoInformationProductPrisma } from "../utils/prisma/modules/AutoInfo";
import { getAllModulesContact } from "../utils/prisma/modules";


export type WebHooksMap = {
    [Bitrix24Event.CRM_DYNAMIC_ITEM_ADD] : [IBitrixWebhookPayload<IDynamicItemEvent>],
    [Bitrix24Event.CRM_DYNAMIC_ITEM_DELETE] : [IBitrixWebhookPayload<IDynamicItemEvent>],
    [Bitrix24Event.CRM_DYNAMIC_ITEM_UPDATE] : [IBitrixWebhookPayload<IDynamicItemEvent>]
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
    const contract = (await bitrixAPI.getItem<IContractBitrix>(portal.portal.domain, token.access_token, CONTRACT_ID_BITRIX.toString(), data.data.FIELDS.ID)).result.item;
    if(!contract) return
    const [myCompanys, products] = await Promise.all([
        getMyCompanysCache(portal, token.access_token),
        (async () => {
            const productRows = await bitrixAPI.getProductRowContract(portal.portal.domain, token.access_token, contract.id!.toString(), CONTRACT_STRING_ID_BITRIX)
            console.log("product", productRows)
            return await Promise.all(productRows.result.productRows.map(async p => {
                const info = await bitrixAPI.getProductInfo(portal.portal.domain, token.access_token, p.productId)
                info.result.product.productName = p.productName
                return {productRows : p, info : info}
            }))
        })()
    ])
    const company = myCompanys.find(c => c.id === contract.mycompanyId);
    await Promise.all([
        addContractPrisma(contractInputMapPrisma(contract, portal.portal.id, company)),
        Promise.all(products.map(async _ => {
            try{
                const p = _.info.result.product;
                const r = _.productRows;
                const key = p.productName as keyof ProductFuncRecord;
                (productFuncCreateRecord[key] as (data: { info: typeof p; productRows: IProductRow }, portal_id: number) => Promise<void>)(
                    { info: p, productRows: r },
                    portal.portal.id
                );
            }
            catch(e){
                console.error(e);
            }
        }))
    ])
    await saveShapshotProduct(contract.id!, portal.portal.id, products.map((p) => ({
        bitrix_id:   p.productRows.id,
        portal_id : portal.portal.id,
        type: p.productRows.productName,
    })))
    console.log("Contract added")
})
webHookEmmiter.on(Bitrix24Event.CRM_DYNAMIC_ITEM_UPDATE, async(data) => {
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
    const contract = (await bitrixAPI.getItem<IContractBitrix>(portal.portal.domain, token.access_token, CONTRACT_ID_BITRIX.toString(), data.data.FIELDS.ID)).result.item;
    if(!contract || contract.companyId === 0) return
    const [myCompanys, products] = await Promise.all([
        getMyCompanysCache(portal, token.access_token),
        (async () => {
            const productRows = await bitrixAPI.getProductRowContract(portal.portal.domain, token.access_token, contract.id!.toString(), CONTRACT_STRING_ID_BITRIX)
            console.log("product", productRows)
            return await Promise.all(productRows.result.productRows.map(async p => {
                const info = await bitrixAPI.getProductInfo(portal.portal.domain, token.access_token, p.productId)
                info.result.product.productName = p.productName
                return {productRows : p, info : info}
            }))
        })()
    ])
    const prev = await getShapshotProduct(contract.id!, portal.portal.id)
    const curr = products.map((p) => ({
        bitrix_id:   p.productRows.id,
        portal_id: portal.portal.id,
        type: p.productRows.productName,
    }))
    const deleted = findDeletedRows(prev, curr)
    const company = myCompanys.find(c => c.id === contract.mycompanyId);
    await Promise.all([
        upsertContractPrisma(portal.portal.id, contractInputMapPrisma(contract, portal.portal.id, company)),
        ...products.map(async _ => {
            try{
                const p = _.info.result.product;
                const r = _.productRows;
                const key = p.productName as keyof ProductFuncRecord;
                await (productFuncUpsertRecord[key] as (data: { info: typeof p; productRows: IProductRow }, portal_id: number) => Promise<void>)(
                    { info: p, productRows: r },
                    portal.portal.id
                );
            }
            catch(e){
                console.error(e);
            }
        }),
        ...deleted.map(async (_) => {
            try {
                await (productFuncDeleteRecord[_.type as ProductEnum] as (
                    id: number,
                    portal_id : number
                ) => Promise<void>)(_.bitrix_id, _.portal_id)
            }
            catch(e) {
                console.error(e)
            }
        })
    ])
    await saveShapshotProduct(contract.id!, portal.portal.id, curr)
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

type ProductDataMap = {
  [ProductEnum.CHAT_BOT]: { info: IChatBotProduct; productRows: IProductRow };
  [ProductEnum.VOICE_ROBOT]: { info: IVoiceRobotProduct; productRows: IProductRow };
  [ProductEnum.VATS] : {info : IVatsProduct, productRows : IProductRow}; 
  [ProductEnum.WEB_FORM] : {info : IWebFormProdruct, productRows : IProductRow};
  [ProductEnum.SMS] : {info : ISmsProduct, productRows : IProductRow};
  [ProductEnum.AUTOINFO] : {info : IAutoInfoProduct, productRows : IProductRow};
}
type ProductFuncRecord = {
  [K in keyof ProductDataMap]: (data: ProductDataMap[K], portal_id: number) => Promise<void>;
};

const productFuncUpsertRecord: ProductFuncRecord = {
  [ProductEnum.CHAT_BOT]: async (data, portal_id) => {await upsertChatBotProductPrisma(data, portal_id)},
  [ProductEnum.VOICE_ROBOT]: async (data, portal_id) => {await upsertVoiceRobotProductPrisma(data, portal_id)},
  [ProductEnum.VATS] : async (data, portal_id) => {await upsertVatsProductPrisma(data, portal_id)},
  [ProductEnum.WEB_FORM] : async (data, portal_id) => {await upsertWebFormProductPrisma(data, portal_id)},
  [ProductEnum.SMS] : async (data, portal_id) => {await upsertAutoInformationProductPrisma(data, portal_id)},
  [ProductEnum.AUTOINFO] : async (data, portal_id) => {await upsertAutoInformationProductPrisma(data, portal_id)}
};
const productFuncCreateRecord: ProductFuncRecord = {
  [ProductEnum.CHAT_BOT]: async (data, portal_id) => {await postChatBotProductPrisma(data, portal_id)},
  [ProductEnum.VOICE_ROBOT]: async (data, portal_id) => {await postVoiceRobotProductPrisma(data, portal_id)},
  [ProductEnum.VATS] : async (data, portal_id) => {await postVatsProductPrisma(data, portal_id)},
  [ProductEnum.WEB_FORM] : async (data, portal_id) => {await postWebFormProducPrisma(data, portal_id)},
  [ProductEnum.SMS] : async (data, portal_id) => {await postAutoInformationProductPrisma(data, portal_id)},
  [ProductEnum.AUTOINFO] : async (data, portal_id) => {await postAutoInformationProductPrisma(data, portal_id)}
};

const productFuncDeleteRecord = {
  [ProductEnum.CHAT_BOT]: async (id : number, portal_id : number) => {await deleteChatBotPrisma(id,portal_id)},
  [ProductEnum.VOICE_ROBOT]: async (id : number, portal_id : number) => {await deleteVoiceRobotPrisma(id,portal_id)},
  [ProductEnum.VATS] : async (id : number, portal_id : number) => {await deleteVatsPrisma(id,portal_id)},
  [ProductEnum.WEB_FORM] : async (id : number, portal_id : number) => {await deleteWebForm(id,portal_id)},
  [ProductEnum.SMS] : async (id : number, portal_id : number) => {await deleteAutoInforPrisma(id,portal_id)},
  [ProductEnum.AUTOINFO] : async (id : number, portal_id : number) => {await deleteAutoInforPrisma(id,portal_id)}
}

function findDeletedRows(prev: { bitrix_id : number, portal_id : number, type: string }[], curr: {bitrix_id : number, portal_id : number, type : string}[]): {bitrix_id : number, portal_id : number, type : string}[] {
  const currIds = new Set(curr.map((r) => r.bitrix_id!));
  return prev.filter((r) => !currIds.has(r.bitrix_id));
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