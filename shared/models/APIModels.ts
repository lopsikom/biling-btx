export interface IContract {
    id : number,
    name : string,
    company_id : number,
    status : string,
    active : boolean,
    index : string,
    temporary : boolean,
    date_begin : string,
    date_close : string,
    org_name : string
}

export interface IContractFilter {
    name? : string,
    company_id? : number,
    bitrxi_company_id : string,
    status? : string,
    active? : boolean,
    index? : string,
    temporary? : boolean,
    date_begin? : string,
    date_close? : string,
    org_name? : string
}

export interface IContractPost{
    name : string,
    company_id? : number,
    bitrix_id? : string,
    status? : number,
    active? : boolean,
    index? : string,
    temporary? : boolean,
    date_begin : string,
    date_close : string,
    org_name? : string
}   
export interface IContractUpdate{
    name? : string,
    company_id? : number,
    status? : number,
    active? : boolean,
    index? : string,
    temporary? : boolean,
    date_begin? : string,
    date_close? : string,
    org_name? : string
}

export interface IVats{
    id : number,
    contract_id : number,
    additional_users : number,
    duration : number,
    title : string
    active : boolean,
    tarrif_id : number,
    price : number
}
export interface IVatsFilter{
    contract_id? : number,
    additional_users? : number,
    duration? : number,
    active? : boolean,
    title? : string,
    bitrix_id? : string,
    tarrif_id? : number,
    price? : number
}

export interface IVatsPost{
    contract_id : number,
    additional_users : number,
    duration : number,
    active : boolean,
    title : string
    tarrif_id? : number,
    price : number
}

export interface IVatsUpdate{
    contract_id? : number,
    additional_users? : number,
    duration? : number,
    title? : string
    active? : boolean,
    tarrif_id? : number,
    price? : number
}

export interface IVoiceRobot{
    id : number,
    title : string
    contract_id : number,
    tarrif_id : number,
    lines : number,
    active : boolean,
    price : number
}
export interface IVoiceRobotFilter{
    contract_id? : number,
    tarrif_id? : number,
    title? : string
    lines? : number,
    bitrix_id? : string,
    active? : boolean,
    price? : number
}
export interface IVoiceRobotPost{
    contract_id : number,
    tarrif_id : number,
    lines : number,
    title : string
    active : boolean,
    price : number
}
export interface IVoiceRobotUpdate{
    contract_id? : number,
    tarrif_id? : number,
    title? : string
    lines? : number,
    active? : boolean,
    price? : number
}

export interface IChatBot {
    id : number,
    title : string
    contract_id : number,
    tarrif_id : number,
    lines_count : number,
    active : boolean,
    price : number,
    messengers : string[]
}

export interface IChatBotFilter {
    contract_id? : number,
    tarrif_id? : number,
    title? : string
    lines_count? : number,
    bitrix_id? : string,
    active? : boolean,
    price? : number,
    messengers? : string[]
}
export interface IChatBotPost {
    contract_id : number,
    title : string
    tarrif_id : number,
    lines_count : number,
    active : boolean,
    price : number,
    messengers : number[]
}
export interface IChatBotUpdate {
    contract_id? : number,
    tarrif_id? : number,
    title? : string
    lines_count? : number,
    active? : boolean,
    price? : number,
    messengers? : number[]
}

export interface IAutoinformation{
    id : number,
    contract_id : number,
    type_id : number,
    quantity : number,
    price : number,
    active : boolean,
    tarrif_id : number,
    title : string
}
export interface IAutoinformationPost{
    contract_id : number,
    type_id : number,
    quantity : number,
    price : number,
    active : boolean,
    tarrif_id? : number,
    title : string
}
export interface IAutoinformationFilterUpdate{
    contract_id? : number,
    type_id? : number,
    quantity? : number,
    price? : number,
    bitrix_id? : string,
    active? : boolean,
    tarrif_id? : number,
    title? : string
}

export interface IWebform{
    id : number,
    contract_id : number,
    tarrif_id : number,
    active : boolean,
    price : number,
    title : string,
    integrations : string[]
}
export interface IWebFormFilterUpdate{
    contract_id? : number,
    tarrif_id? : number,
    active? : boolean,
    price? : number,
    title? : string,
    bitrix_id? : string,
    integrations? : number[]
}
export interface IWebformPost{
    contract_id : number,
    tarrif_id : number,
    active : boolean,
    price : number,
    title : string,
    integrations : number[]
}

export interface IMessengers{
    id : number,
    name : string
}
export interface Integrations extends IMessengers {}
export interface ITarrifs extends IMessengers {}
export interface IContractStatus extends IMessengers {}
