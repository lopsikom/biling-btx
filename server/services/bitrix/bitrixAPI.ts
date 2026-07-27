import type { AxiosInstance } from 'axios'
import axios from 'axios'
import type { AnyProduct, IAppInfo, IBitrixToken, IProductCatalogCreate, IProductRow, IResponseArrayNewBitrix, IResponseNewBitrix, IUser, NewBitrixCompany } from '../models'
import { ICatalogProduct, ICompnany, IContractBitrix } from '../models'
import type { bitrixTokens } from '~~/server/utils/getBitrixToken'
import type { IBitrixFieldMeta } from '../fieldMetadata'
import type { IBitrixCatalogProperty, OfferFieldsMap } from '../catalogMetadata'
import { config } from 'process'
import { useNuxtApp } from 'nuxt/app'
import { b24RateLimiter, extractHost } from '~~/server/utils/rateLimiter'

export interface bitrixResponse<T> {
  result: T
  time: {
    start: number
    finish: number
    duration: number
    processing: number
    date_start: string
    date_finish: string
  }
}

export class bitrixAPI {
  private AxiosClient: AxiosInstance
  private AuthURI: string
  constructor() {
    this.AuthURI = useRuntimeConfig().AuthUri + 'rest/'
    this.AxiosClient = axios.create({ headers: {
      'Content-Type': 'application/json'
    } })
    this.AxiosClient.interceptors.request.use(async (cfg) => {
      await b24RateLimiter.acquire(extractHost(cfg))
      return cfg
    })
    this.AxiosClient.interceptors.response.use(response => response, (error) => {
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

  async getPortalData(token: string): Promise<bitrixResponse<IAppInfo>> {
    const response = await this.AxiosClient.get(this.AuthURI + 'app.info', {
      params: {
        auth: token
      }
    })
    return response.data as bitrixResponse<IAppInfo>
  }

  async getAccesToken(client_id: string, client_secret: string, refresh_token: string) {
    const response = await this.AxiosClient.get(`https://oauth.bitrix24.tech/oauth/token/`, {
      params: {
        grant_type: 'refresh_token',
        client_id: client_id,
        client_secret: client_secret,
        refresh_token: refresh_token
      }

    })
    return response.data as IBitrixToken
  }

  async getPortalToken(code: string, client_id: string, client_secret: string, url: string): Promise<IBitrixToken> {
    const response = await this.AxiosClient.get(`https://${url}/oauth/token/`, {
      params: {
        grant_type: 'authorization_code',
        client_id: client_id,
        client_secret: client_secret,
        code: code
      }

    })
    return response.data as IBitrixToken
  }

  async enterHandler(domain: string, client_id: string) {
    const response = await this.AxiosClient.get(`https://${domain}/oauth/authorize`, {
      params: {
        client_id: client_id
      }
    })
    return response.data as bitrixTokens
  }

  async getCompanies(domain: string, token: string) {
    const response = await this.AxiosClient.get(`https://${domain}/rest/crm.item.list`, {
      params: {
        entityTypeId: 4,
        auth: token
      }
    })
    return response.data as IResponseArrayNewBitrix<NewBitrixCompany>
  }

  async getCompany(id: number, token: string, domain: string) {
    const response = await this.AxiosClient.get(`https://${domain}/rest/crm.item.get`, {
      params: {
        entityTypeId: 4,
        auth: token,
        id: id
      }
    })
    return response.data as IResponseNewBitrix<NewBitrixCompany>
  }

  async getBitrixUsers(domain: string, token: string) {
    const response = await this.AxiosClient.get(`https://${domain}/rest/user.get`, {
      params: {
        auth: token
      }
    })
    return response.data as bitrixResponse<IUser[]>
  }

  async getBitrixUser(domain: string, token: string) {
    const response = await this.AxiosClient.get(`https://${domain}/rest/user.current`, {
      params: {
        auth: token
      }
    })
    return response.data as bitrixResponse<IUser>
  }

  async getItem<T>(domain: string, token: string, entityTypeId: number, id: string | number) {
    const response = await this.AxiosClient.get(`https://${domain}/rest/crm.item.get`, {
      params: {
        entityTypeId: entityTypeId,
        id: id,
        auth: token
      }
    })
    return response.data as IResponseNewBitrix<T>
  }

  async getItems<T>(domain: string, token: string, entityTypeId: string | number, filter?: object) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.list`, {
      filter: filter
    }, {
      params: {
        entityTypeId: entityTypeId,
        auth: token
      }
    })
    return response.data as IResponseArrayNewBitrix<T>
  }

  async getItemFields(domain: string, token: string, entityTypeId: number) {
    const response = await this.AxiosClient.get(`https://${domain}/rest/crm.item.fields`, {
      params: {
        entityTypeId: entityTypeId,
        auth: token
      }
    })
    return response.data as bitrixResponse<{ fields: Record<string, IBitrixFieldMeta> }>
  }

  async getTypes(domain: string, token: string) {
    const response = await this.AxiosClient.get(`https://${domain}/rest/crm.type.list`, {
      params: {
        auth: token
      }
    })
    return response.data as bitrixResponse<{ types: { id: number, entityTypeId: number, title: string }[] }>
  }

  async addItem<T>(domain: string, token: string, entityTypeId: number, fields: Record<string, unknown>) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.add`, {
      entityTypeId: entityTypeId,
      fields: fields
    }, {
      params: { auth: token }
    })
    return response.data as IResponseNewBitrix<T>
  }

  async updateItem<T>(domain: string, token: string, entityTypeId: number, id: number, fields: Record<string, unknown>) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.update`, {
      entityTypeId: entityTypeId,
      id: id,
      fields: fields
    }, {
      params: { auth: token }
    })
    return response.data as IResponseNewBitrix<T>
  }

  async deleteItem(domain: string, token: string, entityTypeId: number, id: number) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.delete`, {
      entityTypeId: entityTypeId,
      id: id
    }, {
      params: { auth: token }
    })
    return response.data as bitrixResponse<unknown>
  }

  async getProductRowContract(domain: string, token: string, ownerId: string, ownerType: string) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.productrow.list`, {
      filter: {
        '=ownerId': ownerId,
        '=ownerType': ownerType
      }
    }, {
      params: {
        auth: token
      }
    })
    return response.data as bitrixResponse<{ productRows: IProductRow[] }>
  }

  // --- Каталог (read-only, для зеркала метаданных модулей, ADR-0006) ---

  /** Товары каталога по id (виды модулей). Обязательные select-поля: id, iblockId. */
  async getCatalogProducts(domain: string, token: string, iblockId: number, ids: number[]) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.product.list`, {
      select: ['id', 'iblockId', 'name', 'iblockSectionId'],
      filter: { iblockId: iblockId, id: ids }
    }, { params: { auth: token } })
    return response.data as bitrixResponse<{ products: { id: number, name: string, iblockSectionId: number | null }[] }>
  }

  /** Все разделы инфоблока (для обхода поддерева корневого раздела каталога). */
  async getCatalogSections(domain: string, token: string, iblockId: number) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.section.list`, {
      filter: { iblockId: iblockId }
    }, { params: { auth: token } })
    return response.data as bitrixResponse<{ sections: { id: number, iblockSectionId: number | null, name: string }[] }>
  }

  /** Товары каталога в заданных разделах (виды модулей = товары под корневым разделом). */
  async getCatalogProductsBySection(domain: string, token: string, iblockId: number, sectionIds: number[]) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.product.list`, {
      select: ['id', 'iblockId', 'name', 'iblockSectionId'],
      filter: { iblockId: iblockId, iblockSectionId: sectionIds }
    }, { params: { auth: token } })
    return response.data as bitrixResponse<{ products: { id: number, name: string, iblockSectionId: number | null }[] }>
  }

  /** Описания свойств offer'ов каталога (id/code/name/propertyType). */
  async getCatalogProperties(domain: string, token: string, iblockId: number) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.productProperty.list`, {
      select: ['id', 'name', 'iblockId', 'propertyType', 'code'],
      filter: { iblockId: iblockId }
    }, { params: { auth: token } })
    return response.data as bitrixResponse<{ productProperties: IBitrixCatalogProperty[] }>
  }

  /**
   * Штатные поля offer'ов каталога (catalog.product.offer.getFieldsByFilter) — аналог
   * crm.item.fields: name/propertyType/isMultiple/isRequired/isDynamic. Ключи — property<id>.
   */
  async getOfferFields(domain: string, token: string, iblockId: number) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.product.offer.getFieldsByFilter`, {
      filter: { iblockId: iblockId }
    }, { params: { auth: token } })
    const r = response.data as { result?: { offer?: OfferFieldsMap, product?: OfferFieldsMap, sku?: OfferFieldsMap } }
    const fields = r.result?.offer ?? r.result?.product ?? r.result?.sku ?? {}
    return fields
  }

  /** Варианты (enum) списочных свойств каталога по их propertyId — для items у полей-селекторов. */
  async getCatalogPropertyEnums(domain: string, token: string, propertyIds: number[]) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.productPropertyEnum.list`, {
      select: ['id', 'propertyId', 'value', 'sort'],
      filter: { propertyId: propertyIds },
      order: { sort: 'asc' }
    }, { params: { auth: token } })
    return response.data as bitrixResponse<{ productPropertyEnums: { id: number, propertyId: number, value: string, sort: number }[] }>
  }

  /** Offer'ы (торговые предложения) по родительскому товару — для образца полей вида. */
  async getCatalogOffers(domain: string, token: string, iblockId: number, parentId: number, propertyCodes: string[]) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.product.offer.list`, {
      select: ['id', 'iblockId', 'name', 'parentId', ...propertyCodes],
      filter: { iblockId: iblockId, parentId: parentId },
      order: { id: 'desc' }
    }, { params: { auth: token } })
    return response.data as bitrixResponse<{ offers: Record<string, unknown>[] }>
  }

  async getProductInfo(domain: string, token: string, id: number) {
    const response = await this.AxiosClient.get(`https://${domain}/rest/catalog.product.get`, {
      params: {
        auth: token,
        id: id
      }
    })
    return response.data as bitrixResponse<{ product: AnyProduct }>
  }

  async setProductRowContract(domain: string, token: string, contract_id: number, product_id: number, ownerType: string, price: number) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.productrow.add`, {
      ownerId: contract_id,
      ownerType: ownerType,
      productId: product_id,
      price: price
    }, {
      params: {
        auth: token
      }
    })
    return response.data as bitrixResponse<{ productRow: IProductRow }>
  }

  async updateCatalogProduct<T extends IProductCatalogCreate>(domain: string, token: string, product_id: number, ownerType: string, data: T) {
    const repsonse = await this.AxiosClient.post(`https://${domain}/rest/catalog.product.update`, {
      id: product_id,
      ownerType: ownerType,
      fields: data
    }, {
      params: {
        auth: token
      }
    })
    return repsonse.data as bitrixResponse<{ product: AnyProduct }>
  }

  async updateProductRowContract(domain: string, token: string, product_id: number, body: object) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.productrow.update`, {
      id: product_id,
      ...body
    }, {
      params: {
        auth: token
      }
    })
    return response.data as bitrixResponse<{ productRow: IProductRow }>
  }

  async deleteProductRow(domain: string, token: string, product_id: number) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.productrow.delete`, {
      id: product_id
    }, {
      params: { auth: token }
    })
    return response.data as bitrixResponse<boolean>
  }

  async addCatalogProduct<T extends IProductCatalogCreate>(domain: string, token: string, parentId: number, body: T) {
    const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.product.offer.add`, {
      fields: {
        iblockId: 16,
        parentId: parentId,
        ...body
      }
    }, {
      params: { auth: token }
    })
    return response.data as bitrixResponse<{ offer: AnyProduct }>
  }
}

export default new bitrixAPI()
