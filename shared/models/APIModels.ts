import * as z from 'zod'

export interface IPagionationResponse<T> {
  data: T[]
  skip?: number
  count: number
}

// Договор на динамических полях (ADR-0003..0005): системные поля — явные ключи,
// всё остальное — values, где ключи = коды полей Bitrix (ufCrm*) из метаданных.
export const Contract = z.object({
  id: z.number(),
  bitrix_id: z.number(),
  name: z.string(),
  company_id: z.number(),
  values: z.record(z.string(), z.unknown())
})

export const ContractFilter = z.object({
  bitrxi_company_id: z.string().optional(),
  name: z.string().optional(),
  company_id: z.number().optional(),
  values: z.record(z.string(), z.unknown()).optional()
})

export const ContractPost = z.object({
  name: z.string().min(1),
  bitrix_id: z.string().optional(),
  company_id: z.number().optional(),
  mycompany_id: z.number().optional(),
  assigned_by_id: z.number().optional(),
  values: z.record(z.string(), z.unknown()).default({})
})

export const ContractUpdate = z.object({
  name: z.string().min(1).optional(),
  mycompany_id: z.number().optional(),
  assigned_by_id: z.number().optional(),
  values: z.record(z.string(), z.unknown()).optional()
})

export type IContract = z.infer<typeof Contract>
export type IContractFilter = z.infer<typeof ContractFilter>
export type IContractPost = z.infer<typeof ContractPost>
export type IContractUpdate = z.infer<typeof ContractUpdate>

// Описание поля из зеркала метаданных — контракт metadata-эндпоинтов
export interface IFieldMeta {
  code: string
  title: string
  type: string
  isRequired: boolean
  isMultiple: boolean
  items?: { id: string, value: string }[]
  default?: unknown
  // Для flag-поля (L-свойство каталога с одним вариантом «Да», отрендеренного как boolean):
  // id варианта «Да» — им пишется значение в Bitrix при включённом чекбоксе.
  trueEnumId?: string
}

export interface IMetadataResponse {
  configured: boolean
  fields: IFieldMeta[]
}

export interface IPortalBinding {
  contract_entity_type_id: number | null
  module_root_section_id: number | null
}

// Модуль на динамических полях (ADR-0004/0006): системные поля — явные ключи,
// динамика — values (ключи = code свойства offer'а из метаданных каталога).
export const Module = z.object({
  id: z.number(),
  bitrix_id: z.number(),
  product_id: z.number().nullable(),
  parent_product_id: z.number(),
  contract_id: z.number().nullable(),
  title: z.string(),
  price: z.number(),
  quantity: z.number(),
  active: z.boolean(),
  values: z.record(z.string(), z.unknown())
})

export const ModuleFilter = z.object({
  contract_id: z.number().optional(),
  parent_product_id: z.number().optional(),
  active: z.boolean().optional(),
  company_bitrix_id: z.string().optional()
})

export const ModulePost = z.object({
  contract_id: z.number(),
  parent_product_id: z.number(),
  title: z.string().min(1),
  price: z.number().default(0),
  quantity: z.number().default(1),
  active: z.boolean().default(true),
  values: z.record(z.string(), z.unknown()).default({})
})

export const ModuleUpdate = z.object({
  contract_id: z.number().optional(),
  title: z.string().min(1).optional(),
  price: z.number().optional(),
  quantity: z.number().optional(),
  active: z.boolean().optional(),
  values: z.record(z.string(), z.unknown()).optional()
})

export type IModule = z.infer<typeof Module>
export type IModuleFilter = z.infer<typeof ModuleFilter>
export type IModulePost = z.infer<typeof ModulePost>
export type IModuleUpdate = z.infer<typeof ModuleUpdate>

// Метаданные вида модуля (поля формы + список видов) — контракт module-metadata эндпоинта
export interface IModuleKind {
  parent_product_id: number
  name: string
  // Категория вида = папка-подраздел каталога (для группировки видов в UI)
  category_id: number | null
  category_name: string | null
}

// Мультиселект-группа полей вида модуля (field group): объединяет несколько
// boolean-свойств offer'а в один селектор в форме (см. миграция 0003).
export interface IFieldGroup {
  name: string
  fields: string[]
}
export type FieldGroupsByKind = Record<number, IFieldGroup[]>

export interface IModuleMetadataResponse {
  configured: boolean
  kinds: IModuleKind[]
  fieldsByKind: Record<number, IFieldMeta[]>
  // Группы полей по видам (для схлопывания boolean-полей в мультиселект)
  groupsByKind: FieldGroupsByKind
  // Скрытые в форме поля по видам (field visibility, коды свойств не показываются)
  hiddenByKind: Record<number, string[]>
}

export const Connection = z.object({
  id: z.number(),
  company_id: z.number(),
  title: z.string(),
  status_id: z.number(),
  type_id: z.number(),
  source: z.string()
})

export const ConnectionPost = z.object({
  company_id: z.xor([z.string(), z.number()]),
  title: z.string(),
  status_id: z.number(),
  type_id: z.number(),
  source: z.string()
})

export const ConnectionPatch = z.object({
  company_id: z.xor([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  status_id: z.number().optional(),
  type_id: z.number().optional(),
  source: z.string().optional()
})

export type IConnection = z.infer<typeof Connection>
export type IConnectionPost = z.infer<typeof ConnectionPost>
export type IConnectionPatch = z.infer<typeof ConnectionPatch>

export enum entityType {
  CONNECTION = 'connection',
  CONTRACT = 'contract',
  MODULE = 'module'
}
export enum EventType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}
export const EventFilter = z.object({
  companyId: z.xor([z.string(), z.number()]).optional(),
  userId: z.number().optional(),
  action: z.enum(EventType).optional(),
  entity: z.enum(entityType).optional(),
  entityName: z.string().optional(),
  createdAt: z.string().optional()
})
export const Event = z.object({
  userId: z.number(),
  action: z.enum(EventType),
  entity: z.enum(entityType),
  entityName: z.string(),
  createdAt: z.string(),
  user_bitrix: z.object({
    id: z.number(),
    name: z.string(),
    last_name: z.string(),
    second_name: z.string().optional()
  })
})

export type IEvent = z.infer<typeof Event>
export type IEventFilter = z.infer<typeof EventFilter>

export interface IUser {
  id: number
  name: string
  last_name: string
  second_name: string

}

// Роль виджета (ADR-0007): 'admin' вычисляется из Bitrix и никогда не назначается
// через API ниже — назначаемы только 'manager'/'viewer'.
export type Role = 'admin' | 'manager' | 'viewer'
export type AssignableRole = Exclude<Role, 'admin'>

export interface IUserRole extends IUser {
  bitrix_id: string
  role: AssignableRole
}

export const UserRolePatch = z.object({
  user_bitrix_id: z.number(),
  role: z.enum(['manager', 'viewer'])
})
export type IUserRolePatch = z.infer<typeof UserRolePatch>

export interface IMessengers {
  id: number
  name: string
}
export interface Integrations extends IMessengers {}
export interface ITarrifs extends IMessengers {}
export interface IConnectionStatus extends IMessengers {}
export interface IConnectionType extends IMessengers { type: connectionTypesEnum }

export enum connectionTypesEnum {
  MESSENGERS = 'messenger',
  SMS = 'sms',
  VATS = 'vats',
  ANOTHER = 'another'
}
export type ICacheCompany = {
  id: number
  title: string
}
