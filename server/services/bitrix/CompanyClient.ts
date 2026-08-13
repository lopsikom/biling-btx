import type { AxiosInstance } from 'axios'
import axios from 'axios'
import type { bitrixResponse } from './bitrixAPI'
import bitrixAPI from './bitrixAPI'
import type { AnyProduct, IAddress, IBitrixToken, ICompnany, IContact, Invoice, IProductCatalogCreate, IProductRow, IProductRowDataCreate, IRequisite } from '../models'
import type { portalPrisma } from '~~/server/utils/prisma/getPortal'
import { redisClient } from '../redis'
import { b24RateLimiter } from '~~/server/utils/rateLimiter'
import { upsertContractFromBitrix } from '~~/server/utils/prisma/modules/Contract'
import type { BitrixItem } from '../fieldMetadata'
import { contractOwnerType } from '~~/server/utils/contractOwnerType'
import { reconcileContractProducts } from '../contractProductSync/reconcileContractProducts'

export default class companyClient {
  domain: string
  bitrix_id: string
  portal_id: number
  axiosClient: AxiosInstance
  constructor(domainBitrix: string, id: number, bitrix_id: string) {
    this.domain = domainBitrix
    this.portal_id = id
    this.bitrix_id = bitrix_id
    this.axiosClient = axios.create({ baseURL: `https://${this.domain}`, headers: {
      'Content-Type': 'application/json'
    } })
    this.axiosClient.interceptors.request.use(async (config) => { // Поменять логику токенов
      await b24RateLimiter.acquire(this.domain)
      if (!config.params) {
        config.params = {}
      }
      if (!config.params.auth) {
        const parseToken = await redisClient.get(`token:${this.portal_id}`)
        if (parseToken) {
          const token = JSON.parse(parseToken) as IBitrixToken
          config.params.auth = token.access_token
          return config
        }
        const portal = await getPortal({ id: this.portal_id })
        if (!portal || !portal.refresh_token) return config
        const token = await bitrixAPI.getAccesToken(portal.client_id, portal.client_secret, portal.refresh_token)
        if (!token) return config
        redisClient.set(`token:${this.portal_id}`, JSON.stringify(token), 'EX', 3000)
        config.params.auth = token.access_token
        return config
      }
      return config
    })
    this.axiosClient.interceptors.response.use(response => response, (error) => {
      const { response, request, config } = error

      console.group(`❌ ERROR [${config?.method?.toUpperCase()}] ${config?.url}`)

      if (response) {
        console.error(`Status:  ${response.status} ${response.statusText}`)
        console.error('Data:   ', response.data)
      } else if (request) {
        console.error('📡 Нет ответа от сервера')
      }
      console.groupEnd()
      // Ошибка должна дойти до вызывающего кода, иначе он читает undefined.data
      return Promise.reject(error)
    })
  }

  async getCompanyInfo() {
    const response = await this.axiosClient.get('/rest/crm.company.get', {
      params: {
        ID: this.bitrix_id
      }
    })
    return response.data as bitrixResponse<ICompnany>
  }

  async getRequisites() {
    const response = await this.axiosClient.get('/rest/crm.requisite.list', {
      params: {
        filter: {
          ENTITY_TYPE_ID: 4,
          ENTITY_ID: this.bitrix_id
        }
      }
    })
    return response.data as bitrixResponse<IRequisite[]>
  }

  async getAddress() {
    const response = await this.axiosClient.get('/rest/crm.address.list', {
      params: {
        filter: {
          ENTITY_TYPE_ID: 4,
          ENTITY_ID: this.bitrix_id
        }
      }
    })
    return response.data as bitrixResponse<IAddress[]>
  }

  async getContacts() {
    const response = await this.axiosClient.get('/rest/crm.contact.list', {
      params: {
        filter: {
          COMPANY_ID: this.bitrix_id
        },
        select: [
          'ID',
          'NAME',
          'LAST_NAME',
          'SECOND_NAME',
          'PHONE',
          'EMAIL',
          'POST',
          'DATE_CREATE',
          'DATE_MODIFY',
          'CREATED_BY_ID',
          'ASSIGNED_BY_ID',
          'MODIFY_BY_ID'
        ]
      }
    })
    return response.data as bitrixResponse<IContact[]>
  }

  async getInvoice() {
    const response = await this.axiosClient.get('/rest/crm.item.list', {
      params: {
        entityTypeId: 31,
        filter: {
          companyId: this.bitrix_id
        }
      }
    })
    return response.data as bitrixResponse<{ items: Invoice[] }>
  }

  async getProductRowContract(ownerId: string, ownerType: string) {
    const response = await this.axiosClient.post('/rest/crm.item.productrow.list', {
      filter: {
        '=ownerId': ownerId,
        '=ownerType': ownerType
      }
    })
    return response.data as bitrixResponse<{ productRows: IProductRow[] }>
  }

  async getProductRowById(id: number) {
    const response = await this.axiosClient.post('/rest/crm.item.productrow.get', { id: id })
    return response.data as bitrixResponse<{ productRow: IProductRow }>
  }

  async getProductInfo(id: number) {
    const response = await this.axiosClient.get('/rest/catalog.product.get', {
      params: { id }
    })
    return response.data as bitrixResponse<{ product: AnyProduct }>
  }

  async addProductRow(contract_id: number, product_id: number, ownerType: string, body: IProductRowDataCreate) {
    console.log('add row', contract_id)
    const response = await this.axiosClient.post('/rest/crm.item.productrow.add', {
      fields: {
        ownerId: contract_id,
        ownerType: ownerType,
        productId: product_id,
        ...body
      }
    })
    return response.data as bitrixResponse<{ productRow: IProductRow }>
  }

  async updateProductRow(product_id: number, body: object) {
    const response = await this.axiosClient.post('/rest/crm.item.productrow.update', {
      id: product_id,
      fields: body
    })
    return response.data as bitrixResponse<{ productRow: IProductRow }>
  }

  async deleteProductRow(product_id: number) {
    const response = await this.axiosClient.get('/rest/crm.item.productrow.delete', { params: { id: product_id } })
    console.log('response delete', response)
    return response.data as bitrixResponse<boolean>
  }

  async deleteProductOffer(product_id: number) {
    const response = await this.axiosClient.post(`/rest/catalog.product.offer.delete`, {
      id: product_id
    })
    return response.data
  }

  async updateCatalogProduct<T extends IProductCatalogCreate>(product_id: number, data: Partial<T>) {
    const response = await this.axiosClient.post('/rest/catalog.product.offer.update', {
      id: product_id,
      fields: data
    })
    return response.data as bitrixResponse<{ product: AnyProduct }>
  }

  async addCatalogProduct<T extends IProductCatalogCreate>(parentId: number, body: T) {
    const response = await this.axiosClient.post('/rest/catalog.product.offer.add', {
      fields: {
        iblockId: 16,
        parentId: parentId,
        ...body
      }
    })
    return response.data as bitrixResponse<{ offer: AnyProduct }>
  }

  async setCatalogPrice(productId: number, price: number, currency = 'RUB', catalogGroupId = 1) {
    const response = await this.axiosClient.post('/rest/catalog.price.add', {
      fields: {
        productId: productId,
        catalogGroupId: catalogGroupId,
        price: price,
        currency: currency
      }
    })
    return response.data as bitrixResponse<{ price: { id: number } }>
  }
}

export async function initCompanyClient(bitrix_id: number, portal: number) {
  let portalPrisma: portalPrisma
  portalPrisma = await getPortal({ id: portal })
  if (!portalPrisma || !portalPrisma.refresh_token) return
  const token = await bitrixAPI.getAccesToken(portalPrisma.client_id, portalPrisma.client_secret, portalPrisma.refresh_token)
  const company = await bitrixAPI.getCompany(bitrix_id, token.access_token, portalPrisma.domain)
  console.log(company)
  const companyPrsima = await postCompany(portalPrisma.id, ...companyMapUpsertPrisma(portalPrisma.id, [], company.result.item))

  await syncCompanyContractsAndProducts(portalPrisma.domain, token.access_token, portalPrisma.id, bitrix_id)

  return new companyClient(portalPrisma.domain, companyPrsima[0].id, bitrix_id.toString())
}

export async function syncCompanyContractsAndProducts(domain: string, token: string, portal_id: number, companyBitrixId: number) {
  const portal = await getPortal({ id: portal_id })
  const entityTypeId = portal?.contract_entity_type_id
  if (!entityTypeId) {
    console.warn(`[syncCompany] у портала ${portal_id} нет привязки смарт-процесса договора — пропускаем`)
    return
  }

  const contracts = (await bitrixAPI.getItems<BitrixItem>(domain, token, entityTypeId, {
    companyId: companyBitrixId
  })).result.items
  if (!contracts.length) return

  await Promise.all(contracts.map(contract => processContract(domain, token, portal_id, entityTypeId, contract)))

  console.log(`[syncCompany] синхронизировано договоров: ${contracts.length}`)
}

export async function syncAllContractsAndProducts(domain: string, token: string, portal_id: number) {
  const portal = await getPortal({ id: portal_id })
  const entityTypeId = portal?.contract_entity_type_id
  if (!entityTypeId) {
    console.warn(`[syncAllContracts] у портала ${portal_id} нет привязки смарт-процесса договора — пропускаем`)
    return
  }

  const contracts = await bitrixAPI.getAllItems<BitrixItem>(domain, token, entityTypeId)
  if (!contracts.length) return

  await Promise.all(contracts.map(contract => processContract(domain, token, portal_id, entityTypeId, contract)))

  console.log(`[syncAllContracts] синхронизировано договоров: ${contracts.length}`)
}

async function processContract(domain: string, token: string, portal_id: number, entityTypeId: number, contract: BitrixItem) {
  try {
    if (!contract.id || !contract.companyId) return

    await upsertContractFromBitrix(portal_id, contract)

    await reconcileContractProducts({
      domain,
      token,
      contractBitrixId: contract.id,
      contractStringId: contractOwnerType(entityTypeId),
      portalId: portal_id,
      mode: 'create'
    })
  } catch (e) {
    console.error(`[syncContract] ошибка обработки договора ${contract.id}`, e)
  }
}
