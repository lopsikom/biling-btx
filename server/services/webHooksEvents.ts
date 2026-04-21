import { EventEmitter } from "node:events";
import { AnyProduct, Bitrix24Event, IAutoInfoProduct, IBitrixWebhookPayload, IChatBotProduct, ICompanyNew, IContractBitrix, IDynamicItemEvent, IProductRow, ISmsProduct, IVatsProduct, IVoiceRobotProduct, IWebFormProdruct, ProductEnum } from "./models";
import {getBitrixTokenByRedis} from "../utils/getBitrixToken"
import bitrixAPI from "./bitrix/bitrixAPI";
import { redisClient } from "./redis";
import { ICacheCompany } from "~~/shared/models/APIModels";
import { upsertContractPrisma } from "../utils/prisma/modules/Contract";
import getMyCompanysCache from "../utils/redis/getMyCompanys";
import { upsertChatBotProductPrisma } from "../utils/prisma/modules/ChatBot";
import { upsertVoiceRobotProductPrisma } from "../utils/prisma/modules/VoiceRobot";
import { upsertVatsProductPrisma } from "../utils/prisma/modules/Vats";
import { upsertWebFormProductPrisma } from "../utils/prisma/modules/WebForm";
import { upsertAutoInformationProductPrisma } from "../utils/prisma/modules/AutoInfo";


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
    const token = await getBitrixTokenByRedis(portal);
    if(!token) return
    const contract = (await bitrixAPI.getItem<IContractBitrix>(portal.portal.domain, token.access_token, CONTRACT_ID_BITRIX.toString(), data.data.FIELDS.ID)).result.item;
    if(!contract) return
    const myCompanys = await getMyCompanysCache(portal, token.access_token);
    const company = myCompanys.find(c => c.id === contract.mycompanyId);
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
    const [myCompanys, products] = await Promise.all([
        getMyCompanysCache(portal, token.access_token),
        (async () => {
            const productRows = await bitrixAPI.getProductRowContract(portal.portal.domain, token.access_token, contract.id!.toString(), CONTRACT_STRING_ID_BITRIX)
            console.log("product", productRows)
            return await Promise.all(productRows.result.productRows.map(async p => {
                const info = await bitrixAPI.getProductInfo(portal.portal.domain, token.access_token, p.productId)
                return {productRows : p, info : info}
            }))
        })()
    ])

    const company = myCompanys.find(c => c.id === contract.mycompanyId);
    await Promise.all([
        upsertContractPrisma(portal.portal.id, contractInputMapPrisma(contract, portal.portal.id, company)),
        Promise.all(products.map(async _ => {
            try{
                console.log("it", _)
                const p = _.info.result.product;
                const r = _.productRows;
                const key = p.productName as keyof ProductFuncRecord;
                console.log({
                key,
                recordKeys: Object.keys(productFuncRecord),
                enumValues: Object.values(ProductEnum),
                });
                (productFuncRecord[key] as (data: { info: typeof p; productRows: IProductRow }, portal_id: number) => Promise<void>)(
                    { info: p, productRows: r },
                    portal.portal.id
                );
            }
            catch(e){
                console.error(e);
            }
        }))
    ])
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

const productFuncRecord: ProductFuncRecord = {
  [ProductEnum.CHAT_BOT]: async (data, portal_id) => {await upsertChatBotProductPrisma(data, portal_id)},
  [ProductEnum.VOICE_ROBOT]: async (data, portal_id) => {await upsertVoiceRobotProductPrisma(data, portal_id)},
  [ProductEnum.VATS] : async (data, portal_id) => {await upsertVatsProductPrisma(data, portal_id)},
  [ProductEnum.WEB_FORM] : async (data, portal_id) => {await upsertWebFormProductPrisma(data, portal_id)},
  [ProductEnum.SMS] : async (data, portal_id) => {await upsertAutoInformationProductPrisma(data, portal_id)},
  [ProductEnum.AUTOINFO] : async (data, portal_id) => {await upsertAutoInformationProductPrisma(data, portal_id)}
};