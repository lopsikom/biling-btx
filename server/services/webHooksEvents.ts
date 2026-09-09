import { EventEmitter } from 'node:events'
import { Bitrix24Event, type IBitrixWebhookPayload, type IDynamicItemEvent, type NewBitrixCompany } from './models'
import { getBitrixTokenByRedis } from '../utils/getBitrixToken'
import bitrixAPI from './bitrix/bitrixAPI'
import { redisClient } from './redis'
import { entityType } from '~~/shared/models/APIModels'
import { upsertContractFromBitrix } from '../utils/prisma/modules/Contract'
import { type BitrixItem, detectMirrorStaleness } from './fieldMetadata'
import { contractOwnerType } from '../utils/contractOwnerType'
import { getAllModulesContact } from '../utils/prisma/modules'
import { reconcileContractProducts } from './contractProductSync/reconcileContractProducts'
import { type EventEntity, eventsAudit } from './EventsAudit'
import postCompanyPrisma from '../utils/prisma/postCompany'
import { compnayMapPostPrisma } from '../utils/mappers'
import getCompanyPrisma from '../utils/prisma/getCompany'
import z from 'zod'
import deleteCompanyPrisma from '../utils/prisma/deleteCompany'
import { recordFault } from '../utils/errorJournal'

export type WebHooksMap = {
  [Bitrix24Event.CRM_DYNAMIC_ITEM_ADD]: [IBitrixWebhookPayload<IDynamicItemEvent>]
  [Bitrix24Event.CRM_DYNAMIC_ITEM_DELETE]: [IBitrixWebhookPayload<IDynamicItemEvent>]
  [Bitrix24Event.CRM_DYNAMIC_ITEM_UPDATE]: [IBitrixWebhookPayload<IDynamicItemEvent>]
  [Bitrix24Event.CRM_COMPANY_ADD]: [IBitrixWebhookPayload<Omit<IDynamicItemEvent, 'ENTITY_TYPE_ID'>>]
  [Bitrix24Event.CRM_COMPANY_DELETE]: [IBitrixWebhookPayload<Omit<IDynamicItemEvent, 'ENTITY_TYPE_ID'>>]
}

export const webHookEmmiter = new EventEmitter<WebHooksMap>()

// Обработчики вебхуков — async-листенеры: HTTP-ответ Bitrix уже отдан, и сбой
// внутри никуда не всплывает. Без этой обёртки он либо роняет процесс
// (необработанный reject), либо теряется в console.error без указания портала
// и события. Здесь сбой попадает в журнал с опознавательным контекстом (ADR-0009).
function onWebhook<E extends keyof WebHooksMap>(
  event: E,
  handler: (data: WebHooksMap[E][0]) => Promise<void>
) {
  webHookEmmiter.on(event, (async (data: WebHooksMap[E][0]) => {
    try {
      await handler(data)
    } catch (e) {
      recordFault(e, 'internal', 500, {
        source: 'webhook',
        extra: {
          event,
          domain: (data as { auth?: { domain?: string } })?.auth?.domain,
          fields: (data as { data?: unknown })?.data
        },
        request: { body: data }
      })
    }
  }) as never)
}

onWebhook(Bitrix24Event.CRM_DYNAMIC_ITEM_ADD, async (data) => {
  const portal = await getPortalByUserBitrix(data.auth.access_token)
  if (!portal) return
  const entityTypeId = portal.portal.contract_entity_type_id
  if (!entityTypeId || data.data.FIELDS.ENTITY_TYPE_ID !== entityTypeId.toString()) return
  const locked = await redisClient.get(`lock:contract:${data.data.FIELDS.ID}_${portal.portal.id}`)
  if (locked) {
    console.log(`[webhook] пропускаем — изменение инициировано нами`)
    return
  }
  const token = await getBitrixTokenByRedis(portal)
  if (!token) return
  const contract = (await bitrixAPI.getItem<BitrixItem>(portal.portal.domain, token.access_token, entityTypeId, data.data.FIELDS.ID)).result.item
  if (!contract?.companyId) { console.warn('Нету контракта или контракт без компании'); return }
  await detectMirrorStaleness(portal.portal.id, 'contract', contract)
  const companyPrisma = await getCompanyPrisma(contract.companyId!.toString(), portal.portal.id)
  if (!companyPrisma) {
    const companyBitrix = await bitrixAPI.getItem<NewBitrixCompany>(portal.portal.domain, token.access_token, 4, contract.companyId!)
    if (!companyBitrix.result.item) { console.warn('Не удалось найти компанию'); return }
    await postCompanyPrisma(portal.portal.id, compnayMapPostPrisma(portal.portal.id, companyBitrix.result.item))
  }
  await upsertContractFromBitrix(portal.portal.id, contract).then((c) => {
    eventsAudit.emit('entity.create', {
      userid: portal.user_id,
      entity: entityType.CONTRACT,
      entityName: c.name,
      companyid: c.company_id
    } as EventEntity)
  })
  await reconcileContractProducts({
    domain: portal.portal.domain,
    token: token.access_token,
    contractBitrixId: contract.id,
    contractStringId: contractOwnerType(entityTypeId),
    portalId: portal.portal.id,
    mode: 'create',
    userId: portal.user_id
  })
  console.log('Contract added')
})
onWebhook(Bitrix24Event.CRM_DYNAMIC_ITEM_UPDATE, async (data) => {
  const portal = await getPortalByUserBitrix(data.auth.access_token)
  if (!portal) return
  const entityTypeId = portal.portal.contract_entity_type_id
  if (!entityTypeId || data.data.FIELDS.ENTITY_TYPE_ID !== entityTypeId.toString()) return
  const locked = await redisClient.get(`lock:contract:${data.data.FIELDS.ID}_${portal.portal.id}`)
  if (locked) {
    console.log(`[webhook] пропускаем — изменение инициировано нами`)
    return
  }
  const token = await getBitrixTokenByRedis(portal)
  if (!token) return
  const contract = (await bitrixAPI.getItem<BitrixItem>(portal.portal.domain, token.access_token, entityTypeId, data.data.FIELDS.ID)).result.item
  if (!contract || contract.companyId === 0) return
  await detectMirrorStaleness(portal.portal.id, 'contract', contract)
  const companyPrisma = await getCompanyPrisma(contract.companyId!.toString(), portal.portal.id)
  if (!companyPrisma) {
    const companyBitrix = await bitrixAPI.getItem<NewBitrixCompany>(portal.portal.domain, token.access_token, 4, contract.companyId!)
    if (!companyBitrix.result.item) { console.warn('Не удалось найти компанию'); return }
    await postCompanyPrisma(portal.portal.id, compnayMapPostPrisma(portal.portal.id, companyBitrix.result.item))
  }
  await upsertContractFromBitrix(portal.portal.id, contract)
  await reconcileContractProducts({
    domain: portal.portal.domain,
    token: token.access_token,
    contractBitrixId: contract.id,
    contractStringId: contractOwnerType(entityTypeId),
    portalId: portal.portal.id,
    mode: 'reconcile',
    userId: portal.user_id
  })
  console.log('Contract updated')
})

onWebhook(Bitrix24Event.CRM_DYNAMIC_ITEM_DELETE, async (data) => {
  const portal = await getPortalByUserBitrix(data.auth.access_token)
  if (!portal) return
  const entityTypeId = portal.portal.contract_entity_type_id
  if (!entityTypeId || data.data.FIELDS.ENTITY_TYPE_ID !== entityTypeId.toString()) return
  const locked = await redisClient.get(`lock:contract:${data.data.FIELDS.ID}_${portal.portal.id}`)
  if (locked) {
    console.log(`[webhook] пропускаем — удаление инициировано нами`)
    return
  }
  const contract = await deleteContractPrisma(Number(data.data.FIELDS.ID), portal.portal.id)
  eventsAudit.emit('entity.delete', {
    userid: portal.user_id,
    entity: entityType.CONTRACT,
    entityName: contract.name,
    companyid: contract.company_id
  })
  console.log('Contract deleted')
})

onWebhook(Bitrix24Event.CRM_COMPANY_ADD, async (data) => {
  const portal = await getPortalByUserBitrix(data.auth.access_token)
  if (!portal) return
  const token = await getBitrixTokenByRedis(portal)
  if (!token) return
  const id = z.number().parse(data.data.FIELDS.ID)
  const company = await bitrixAPI.getCompany(id, token.access_token, portal.portal.domain)
  if (!company.result) return
  await postCompany(portal.portal.id, ...companyMapUpsertPrisma(portal.portal.id, [], company.result.item))
})
onWebhook(Bitrix24Event.CRM_COMPANY_DELETE, async (data) => {
  const portal = await getPortalByUserBitrix(data.auth.access_token)
  if (!portal) return
  const token = await getBitrixTokenByRedis(portal)
  if (!token) return
  await deleteCompanyPrisma(data.data.FIELDS.ID, portal.portal.id)
})

export function emitBitrixEvent(event: keyof WebHooksMap, payload: IBitrixWebhookPayload<any>) {
  webHookEmmiter.emit(event, payload)
}

export async function getShapshotProduct(contract_id: number, portal_id: number) {
  const key = `product-shapshot:${contract_id}_${portal_id}`
  const cached = await redisClient.get(key)
  if (cached) {
    return JSON.parse(cached) as { bitrix_id: number, portal_id: number, type: string }[]
  }
  const products = await getAllModulesContact(contract_id, portal_id)
  await saveShapshotProduct(contract_id, portal_id, products)
  return products.filter(p => p.bitrix_id && p.portal_id)
}

export async function saveShapshotProduct(contract_id: number, portal_id: number, data: { bitrix_id: number, portal_id: number, type: string }[]) {
  const key = `product-shapshot:${contract_id}_${portal_id}`
  await redisClient.set(key, JSON.stringify(data), 'EX', 60 * 60 * 24)
}
