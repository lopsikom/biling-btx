import * as z from "zod"


export interface IPagionationResponse<T>{
    data : T[],
    skip? : number,
    count : number
}


export const Contract = z.object({
    id : z.number(),
    name : z.string(),
    company_id : z.number(),
    status : z.string(),
    index : z.string(),
    date_begin : z.string().optional(),
    date_close : z.string().optional(),
    date_sign : z.string().optional(),
    doc_type : z.string().optional(),
    prolongation : z.string().optional(),
    original_type : z.string().optional(),
    org_name : z.string()
})

export const ContractFilter = z.object({
    bitrxi_company_id : z.string(),
    name : z.string().optional(),
    company_id : z.number().optional(),
    status : z.string().optional(),
    index : z.string().optional(),
    date_begin : z.string().optional(),
    date_close : z.string().optional(),
    date_sign : z.string().optional(),
    doc_type : z.string().optional(),
    prolongation : z.string().optional(),
    original_type : z.string().optional(),
    org_name : z.string().optional()
})

export const ContractPost = z.object({
    name : z.string(),
    bitrix_id : z.string().optional(),
    company_id : z.number().optional(),
    status : z.number().optional(),
    index : z.string().optional(),
    date_begin : z.string(),
    date_close : z.string(),
    date_sign : z.string().optional(),
    doc_type : z.number().optional(),
    prolongation : z.number().optional(),
    original_type : z.number().optional(),
    org_name : z.string().optional()
})

export const ContractUpdate = z.object({
    name : z.string().optional(),
    company_id : z.number().optional(),
    status : z.number().optional(),
    index : z.string().optional(),
    date_begin : z.string().optional(),
    date_close : z.string().optional(),
    date_sign : z.string().optional(),
    doc_type : z.number().optional(),
    prolongation : z.number().optional(),
    original_type : z.number().optional(),
    org_name : z.string().optional()
})

export type IContract = z.infer<typeof Contract>
export type IContractFilter = z.infer<typeof ContractFilter>
export type IContractPost = z.infer<typeof ContractPost>
export type IContractUpdate = z.infer<typeof ContractUpdate>

export const Vats = z.object({
    id : z.number(),
    contract_id : z.number(),
    additional_users : z.number(),
    duration : z.number(),
    title : z.string(),
    active : z.boolean(),
    tarrif_id : z.number(),
    price : z.number()
})

export const VatsFilter = z.object({
    contract_id : z.number().optional(),
    additional_users : z.number().optional(),
    duration : z.number().optional(),
    title : z.string().optional(),
    active : z.boolean().optional(),
    tarrif_id : z.number().optional(),
    price : z.number().optional(),
    bitrix_id : z.string().optional()
})

export const VatsPost = z.object({
    contract_id : z.number(),
    additional_users : z.number(),
    duration : z.number(),
    title : z.string(),
    active : z.boolean(),
    tarrif_id : z.number().optional(),
    price : z.number()
})

export const VatsUpdate = z.object({
    contract_id : z.number().optional(),
    additional_users : z.number().optional(),
    duration : z.number().optional(),
    title : z.string().optional(),
    active : z.boolean().optional(),
    tarrif_id : z.number().optional(),
    price : z.number().optional()
})

export type IVats = z.infer<typeof Vats>
export type IVatsFilter = z.infer<typeof VatsFilter>
export type IVatsPost = z.infer<typeof VatsPost>
export type IVatsUpdate = z.infer<typeof VatsUpdate>

export const VoiceRobot = z.object({
    id : z.number(),
    title : z.string(),
    contract_id : z.number(),
    tarrif_id : z.number(),
    lines : z.number(),
    active : z.boolean(),
    price : z.number()
})

export const VoiceRobotFilter = z.object({
    title : z.string().optional(),
    contract_id : z.number().optional(),
    tarrif_id : z.number().optional(),
    lines : z.number().optional(),
    active : z.boolean().optional(),
    price : z.number().optional(),
    bitrix_id : z.string().optional()
})

export const VoiceRobotPost= z.object({
    title : z.string(),
    contract_id : z.number(),
    tarrif_id : z.number(),
    lines : z.number(),
    active : z.boolean(),
    price : z.number()
})

export const VoiceRobotUpdate = z.object({
    title : z.string().optional(),
    contract_id : z.number().optional(),
    tarrif_id : z.number().optional(),
    lines : z.number().optional(),
    active : z.boolean().optional(),
    price : z.number().optional(),
})

export type IVoiceRobot = z.infer<typeof VoiceRobot>
export type IVoiceRobotFilter = z.infer<typeof VoiceRobotFilter>
export type IVoiceRobotPost = z.infer<typeof VoiceRobotPost>
export type IVoiceRobotUpdate = z.infer<typeof VoiceRobotUpdate>

export const ChatBot = z.object({
    id : z.number(),
    title : z.string(),
    contract_id : z.number(),
    tarrif_id : z.number(),
    lines_count : z.number(),
    active : z.boolean(),
    price : z.number(),
    messengers : z.array(z.string())
})

export const ChatBotFilter = z.object({
    bitrix_id : z.string().optional(),
    title : z.string().optional(),
    contract_id : z.number().optional(),
    tarrif_id : z.number().optional(),
    lines_count : z.number().optional(),
    active : z.boolean().optional(),
    price : z.number().optional(),
    messengers : z.array(z.string()).optional()
})

export const ChatBotPost = z.object({
    title : z.string(),
    contract_id : z.number(),
    tarrif_id : z.number(),
    lines_count : z.number(),
    active : z.boolean(),
    price : z.number(),
    messengers : z.array(z.number())
})

export const ChatBotUpdate = z.object({
    title : z.string().optional(),
    contract_id : z.number().optional(),
    tarrif_id : z.number().optional(),
    lines_count : z.number().optional(),
    active : z.boolean().optional(),
    price : z.number().optional(),
    messengers : z.array(z.number()).optional()
})

export type IChatBot = z.infer<typeof ChatBot>
export type IChatBotFilter = z.infer<typeof ChatBotFilter>
export type IChatBotPost = z.infer<typeof ChatBotPost>
export type IChatBotUpdate = z.infer<typeof ChatBotUpdate>

export const AutoInformation = z.object({
    id : z.number(),
    contract_id : z.number(),
    type_id : z.number(),
    quantity : z.number(),
    price : z.number(),
    active : z.boolean(),
    tarrif_id : z.number(),
    title : z.string()
})

export const AutoInformationPost = z.object({
    contract_id : z.number(),
    type_id : z.number(),
    quantity : z.number(),
    price : z.number(),
    active : z.boolean(),
    tarrif_id : z.number().optional(),
    title : z.string()
})

export const AutoInformationFilterUpdate = z.object({
    bitrix_id : z.string().optional(),
    contract_id : z.number().optional(),
    type_id : z.number().optional(),
    quantity : z.number().optional(),
    price : z.number().optional(),
    active : z.boolean().optional(),
    tarrif_id : z.number().optional(),
    title : z.string().optional()
})

export type IAutoinformation = z.infer<typeof AutoInformation>
export type IAutoinformationPost = z.infer<typeof AutoInformationPost>
export type IAutoinformationFilterUpdate = z.infer<typeof AutoInformationFilterUpdate>

export const WebForm = z.object({
    id : z.number(),
    contract_id : z.number(),
    tarrif_id : z.number(),
    active : z.boolean(),
    price : z.number(),
    title : z.string(),
    integrations : z.array(z.string())
})

export const WebFormFilterUpdate = z.object({
    bitrix_id : z.string().optional(),
    contract_id : z.number().optional(),
    tarrif_id : z.number().optional(),
    active : z.boolean().optional(),
    price : z.number().optional(),
    title : z.string().optional(),
    integrations : z.array(z.number()).optional(),
})

export const WebFormPost = z.object({
    contract_id : z.number(),
    tarrif_id : z.number(),
    active : z.boolean(),
    price : z.number(),
    title : z.string(),
    integrations : z.array(z.number())
})

export type IWebform = z.infer<typeof WebForm>
export type IWebFormFilterUpdate = z.infer<typeof WebFormFilterUpdate>
export type IWebformPost = z.infer<typeof WebFormPost>

export const Connection = z.object({
    id : z.number(),
    company_id : z.number(),
    title : z.string(),
    status_id : z.number(),
    type_id : z.number(),
    source : z.string()
})

export const ConnectionPost = z.object({
    company_id : z.xor([z.string(), z.number()]),
    title : z.string(),
    status_id : z.number(),
    type_id : z.number(),
    source : z.string()
})

export const ConnectionPatch = z.object({
    company_id : z.xor([z.string(), z.number()]).optional(),
    title : z.string().optional(),
    status_id : z.number().optional(),
    type_id : z.number().optional(),
    source : z.string().optional()
})

export type IConnection = z.infer<typeof Connection>
export type IConnectionPost = z.infer<typeof ConnectionPost>
export type IConnectionPatch = z.infer<typeof ConnectionPatch>

export enum entityType {
    CONNECTION = "connection",
    AUTOINFORMATION = "autoinformation",
    CHAT_BOT = "chat_bot",
    CONTRACT = "contract",
    VATS = "vats",
    VOICE_ROBOT = "voice_robot",
    WEBFORM = "webform"
}
export enum EventType {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete"
}
export const EventFilter = z.object({
    companyId : z.xor([z.string(), z.number()]).optional(),
    userId : z.number().optional(),
    action : z.enum(EventType).optional(),
    entity : z.enum(entityType).optional(),
    entityName : z.string().optional(),
    createdAt : z.string().optional()
})
export const Event = z.object({
    userId : z.number(),
    action : z.enum(EventType),
    entity : z.enum(entityType),
    entityName : z.string(),
    createdAt : z.string(),
    user_bitrix : z.object({
        id : z.number(),
        name : z.string(),
        last_name : z.string(),
        second_name : z.string().optional()
    })
})

export type IEvent = z.infer<typeof Event>
export type IEventFilter = z.infer<typeof EventFilter>

export interface IUser{
    id : number,
    name : string,
    last_name : string,
    second_name : string

}

export interface IMessengers{
    id : number,
    name : string
}
export interface Integrations extends IMessengers {}
export interface ITarrifs extends IMessengers {}
export interface IContractStatus extends IMessengers {}
export interface IContractDocType extends IMessengers {}
export interface IContractProlongation extends IMessengers {}
export interface IContractOriginalType extends IMessengers {}
export interface IConnectionStatus extends IMessengers {}
export interface IConnectionType extends IMessengers {type : connectionTypesEnum}

export enum connectionTypesEnum {
    MESSENGERS = "messenger",
    SMS = "sms",
    VATS = "vats",
    ANOTHER = "another"
}
export type ICacheCompany = {
    id : number,
    title : string,
}



