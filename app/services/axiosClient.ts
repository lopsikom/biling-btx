import axios from 'axios'
import type { B24Frame } from '@bitrix24/b24jssdk'
import type { FieldGroupsByKind, IConnection, IConnectionPatch, IConnectionPost, IConnectionStatus, IConnectionType, IContract, IContractFilter, IContractPost, IContractUpdate, IEvent, IEventFilter, IFieldGroup, IMetadataResponse, IModule, IModuleFilter, IModuleMetadataResponse, IModulePost, IModuleUpdate, IPagionationResponse, IPortalBinding, ITag, ITagCompany, ITagCreatae, ITagUnBind, IUser, IUserRole, IUserRolePatch, Role } from '~~/shared/models/APIModels'
import { Bitrix24Placement, type IResponseArrayNewBitrix } from '~~/shared/models/bitrixModels'

export const BitrixPlacementMap: Record<Bitrix24Placement, (frame: B24Frame) => Promise<string>> = {
  [Bitrix24Placement.COMPANY]: (frame) => {
    return frame.placement.options.ID
  },
  [Bitrix24Placement.DEAL]: async (frame) => {
    const id = frame.placement.options.ID
    const companyId = (await frame.callMethod('crm.deal.get', { id: id })).getData().result.COMPANY_ID
    return companyId
  },
  [Bitrix24Placement.QUOTE]: async (frame) => {
    const id = frame.placement.options.ID
    const companyId = (await frame.callMethod('crm.quote.get', { id: id })).getData().result.COMPANY_ID
    return companyId
  },
  [Bitrix24Placement.CONTACT]: async (frame) => {
    const id = frame.placement.options.ID
    const companyId = (await frame.callMethod('crm.contact.get', { id: id })).getData().result.COMPANY_ID
    return companyId
  },
  [Bitrix24Placement.CONTRACT]: async (frame) => {
    const id = frame.placement.options.ID
    const companyId = (await frame.callMethod('crm.item.get', { id: id, entityTypeId: 1058 })).getData().result.item.companyId // хардкод
    return (companyId as number).toString()
  }
}

export class axiosClient {
  private AxiosClient
  private BitrixFrame: B24Frame | undefined
  private companyId: string | null = null
  constructor() {
    const url = useRuntimeConfig().public.BaseUri + useRuntimeConfig().public.BaseUrl + 'api/'
    this.AxiosClient = axios.create({ baseURL: url, headers: {
      'Content-Type': 'application/json'
    } })
    this.AxiosClient.interceptors.request.use(async (config) => {
      if (!config.headers.Authorization) {
        if (this.BitrixFrame) {
          const auth = this.BitrixFrame.auth.getAuthData()
          if (auth) config.headers.Authorization = auth.access_token
        }
      }
      return config
    })
    this.AxiosClient.interceptors.response.use(async (response) => {
      if (useNuxtApp().$config.public.dev) console.log(response.data)
      return response
    })
  }

  set setBitrixFrame(BitrixFrame: B24Frame) { this.BitrixFrame = BitrixFrame }

  async verifyBitrixUser(token: string) {
    const response = await this.AxiosClient.get<boolean>('oauth/verify.install', {
      headers: {
        Authorization: token
      }
    })
    return response.data
  }

  async getCompanyId() {
    if (!this.BitrixFrame) return
    if (!this.companyId) {
      const id = await BitrixPlacementMap[this.BitrixFrame.placement.title as Bitrix24Placement](this.BitrixFrame)
      this.companyId = id
    }
    return this.companyId
  }

  async getCheckCompany() {
    const companyId = await this.getCompanyId()
    if (!companyId) return
    const response = await this.AxiosClient.get<boolean>(`bitrix/company.check/${companyId}`)
    return response.data
  }

  async getContractMetadata(refresh = false) {
    try {
      const response = await this.AxiosClient.get('metadata/contract', {
        params: refresh ? { refresh: '1' } : undefined
      })
      return response.data as IMetadataResponse
    } catch (e) {
      console.error('[getContractMetadata] не удалось получить метаданные полей', e)
      return { configured: false, fields: [] } as IMetadataResponse
    }
  }

  async getPortalBinding() {
    const response = await this.AxiosClient.get('portal/binding')
    return response.data as IPortalBinding
  }

  async patchPortalBinding(data: Partial<IPortalBinding>) {
    const response = await this.AxiosClient.patch('portal/binding', data)
    return response.data as IPortalBinding
  }

  async getFieldGroups() {
    const response = await this.AxiosClient.get('portal/field-groups')
    return response.data as FieldGroupsByKind
  }

  async patchFieldGroups(parent_product_id: number, groups: IFieldGroup[]) {
    const response = await this.AxiosClient.patch('portal/field-groups', { parent_product_id, groups })
    return response.data as IFieldGroup[]
  }

  async patchFieldVisibility(parent_product_id: number, hidden_fields: string[]) {
    const response = await this.AxiosClient.patch('portal/field-visibility', { parent_product_id, hidden_fields })
    return response.data as string[]
  }

  async getBitrixTypes() {
    const response = await this.AxiosClient.get('bitrix/types.list')
    return response.data as { entityTypeId: number, title: string }[]
  }

  async getCatalogSections() {
    const response = await this.AxiosClient.get('bitrix/catalog-sections.list')
    return response.data as { id: number, iblockSectionId: number | null, name: string }[]
  }

  async getCatalogSectionProductsCount(sectionId: number) {
    const response = await this.AxiosClient.get('bitrix/catalog-sections/products-count', { params: { sectionId } })
    return response.data as { productCount: number }
  }

  async postPortalSync() {
    const response = await this.AxiosClient.post<boolean>('portal/sync')
    return response.data
  }

  async getContracts(data: { filter?: Partial<IContractFilter> }): Promise<IContract[]>
  async getContracts(data: { filter?: Partial<IContractFilter>, pagination?: { skip: number, limit: number } }): Promise<IPagionationResponse<IContract>>
  async getContracts(data: { filter?: Partial<IContractFilter>, pagination?: { skip: number, limit: number } }) {
    const params: any = {}
    const filter = { ...data.filter, bitrxi_company_id: await this.getCompanyId() ?? (useNuxtApp().$config.public.dev ? '2' : '0') }
    params.filter = JSON.stringify(filter)
    if (data.pagination) {
      params.skip = data.pagination.skip,
      params.limit = data.pagination.limit
    }
    const response = await this.AxiosClient.get('modules/contract.list', {
      params: {
        ...params
      }
    })
    if (data.pagination) return response.data as IPagionationResponse<IContract>
    else return response.data as IContract[]
  }

  async getContractById(id: number) {
    const response = await this.AxiosClient.get(`modules/contract/${id}`)
    return response.data as IContract
  }

  async deleteContract(id: number) {
    const response = await this.AxiosClient.delete(`modules/contract/${id}`)
    return response.data as boolean
  }

  async postContract(data: IContractPost) {
    if (!data.company_id) {
      if (useNuxtApp().$config.public.dev) data.bitrix_id = await this.getCompanyId() ?? '2'
      else data.bitrix_id = await this.getCompanyId()
    }
    const response = await this.AxiosClient.post('modules/contract.add', data)
    return response.data as IContract
  }

  async patchContract(data: IContractUpdate, id: number) {
    const response = await this.AxiosClient.patch(`modules/contract/${id}`, data)
    return response.data as IContract
  }

  async getModuleMetadata(refresh = false) {
    try {
      const response = await this.AxiosClient.get('metadata/module', { params: refresh ? { refresh: '1' } : undefined })
      return response.data as IModuleMetadataResponse
    } catch (e) {
      console.error('[getModuleMetadata] не удалось получить метаданные каталога', e)
      return { configured: false, kinds: [], fieldsByKind: {}, groupsByKind: {}, hiddenByKind: {} } as IModuleMetadataResponse
    }
  }

  async getModules(filter?: Partial<IModuleFilter>) {
    const response = await this.AxiosClient.get('modules/module.list', { params: filter ? { filter: JSON.stringify(filter) } : undefined })
    return response.data as IModule[]
  }

  async getModuleById(id: number) {
    const response = await this.AxiosClient.get(`modules/module/${id}`)
    return response.data as IModule
  }

  async postModule(data: IModulePost) {
    const response = await this.AxiosClient.post('modules/module.add', data)
    return response.data as IModule
  }

  async patchModule(id: number, data: IModuleUpdate) {
    const response = await this.AxiosClient.patch(`modules/module/${id}`, data)
    return response.data as IModule
  }

  async deleteModule(id: number) {
    const response = await this.AxiosClient.delete(`modules/module/${id}`)
    return response.data as boolean
  }

  async getConnectionStatus() {
    const response = await this.AxiosClient.get(`connection.status`)
    return response.data as IConnectionStatus[]
  }

  async getConnectionType() {
    const response = await this.AxiosClient.get(`connection.type`)
    return response.data as IConnectionType[]
  }

  async getConnectionList(data?: IConnectionPatch) {
    const response = await this.AxiosClient.get(`connection.list`, {
      params: {
        filter: JSON.stringify(data)
      }
    })
    return response.data as IConnection[]
  }

  async postConnection(data: IConnectionPost) {
    if (!data.company_id) {
      if (useNuxtApp().$config.public.dev) data.company_id = await this.getCompanyId() ?? '2'
      else data.company_id = await this.getCompanyId() ?? ''
    }
    const response = await this.AxiosClient.post(`connection.add`, data)
    return response.data as IConnection
  }

  async patchConnection(data: IConnectionPatch, id: number) {
    const response = await this.AxiosClient.patch(`connection/${id}`, data)
    return response.data as IConnection
  }

  async deleteConnection(id: number) {
    const response = await this.AxiosClient.delete(`connection/${id}`)
    return response.data as boolean
  }

  async getEvents(data: { filter: IEventFilter }): Promise<IEvent[]>
  async getEvents(data: { filter?: IEventFilter, pagination: { skip: number, limit: number } }): Promise<IPagionationResponse<IEvent>>
  async getEvents(data: { filter?: IEventFilter, pagination?: { skip: number, limit: number } }) {
    const params: any = {}
    const filter = { ...data.filter, companyId: await this.getCompanyId()
      ?? (useNuxtApp().$config.public.dev ? '2' : '0') } as IEventFilter
    params.filter = JSON.stringify(filter)
    if (data.pagination) {
      params.skip = data.pagination.skip,
      params.limit = data.pagination.limit
    }
    const response = await this.AxiosClient.get(`event.list`, {
      params: {
        ...params
      }
    })
    if (data.pagination) return response.data as IPagionationResponse<IEvent>
    else return response.data as IEvent[]
  }

  async getUsers() {
    const response = await this.AxiosClient.get<IUser[]>(`bitrix/user.list`)
    return response.data
  }

  async getMyRole() {
    const response = await this.AxiosClient.get<{ role: Role }>('portal/me')
    return response.data.role
  }

  async getPortalRoles() {
    const response = await this.AxiosClient.get<IUserRole[]>('portal/roles')
    return response.data
  }

  async patchPortalRole(data: IUserRolePatch) {
    const response = await this.AxiosClient.patch<IUserRolePatch>('portal/roles', data)
    return response.data
  }
  async getTagList() {
    const response = await this.AxiosClient.get<ITag[]>('tag.list')
    return response.data
  }
  async getTagsCompany(company_id : string) {
    const response = await this.AxiosClient.get<ITagCompany[]>(`tag.company/${company_id}`)
    return response.data
  }
  async postTag(body : ITagCreatae) {
    const response = await this.AxiosClient.post<ITag>('tag.add', body)
    return response.data
  }
  async postBindTagCompany(company_id : string, tag_id : number) {
    const response = await this.AxiosClient.post<ITagUnBind>('tag.bind', {
      company_id,
      tag_id
    })
    return response.data
  }
  async postUnBindTagCompany(company_id : number | string, tag_id : number) {
    const response = await this.AxiosClient.post<boolean>('tag.unind', {
      company_id,
      tag_id
    })
    return response.data
  }
  async deleteTag(id : number) {
    const response = await this.AxiosClient.delete<boolean>(`tag/${id}`)
    return response.data
  }
}
