import { Contract, ContractPost, IAutoinformationFilterUpdate, IAutoinformationPost, ICacheCompany, IChatBot, IChatBotPost, IChatBotUpdate, IConnection, IConnectionPatch, IConnectionPost, IContract, IContractFilter, IContractPost, IContractUpdate, IVats, IVatsPost, IVatsUpdate, IVoiceRobotPost, IVoiceRobotUpdate, IWebform, IWebFormFilterUpdate, IWebformPost } from "~~/shared/models/APIModels";
import { IAddress, ICompnany, IContact, IContactInfo, IContractBitrix, Invoice, IRequisite, IUser, NewBitrixCompany } from "../services/models";
import { contract, user_bitrix } from "../services/models/generated/prisma/client";
import { addressCreateInput, autoinformation_moduleCreateInput, autoinformation_moduleUpdateInput, chat_botCreateInput, chat_botUpdateInput, companyCreateInput, connectionCreateInput, contact_emailCreateInput, contact_phonesCreateInput, contactCreateInput, contractCreateInput, contractUpdateInput, invoiceCreateInput, requisiteCreateInput, user_bitrixCreateInput, vatsCreateInput, vatsUpdateInput, voice_robotCreateInput, voice_robotUpdateInput, webformCreateInput, webformUpdateInput } from "../services/models/generated/prisma/models";
import { ContactWithData } from "./prisma/postContact";
import { connectionPrisma } from "./prisma/Connection";
import { contractPrismaGet } from "./prisma/modules/Contract";
import * as z from "zod"

export function userMapUpsertPrisma(portal_id: number, user: IUser): user_bitrixCreateInput;
export function userMapUpsertPrisma(portal_id: number, user: IUser[]): user_bitrixCreateInput[];
export function userMapUpsertPrisma(
  portal_id: number,
  user: IUser | IUser[]
): user_bitrixCreateInput | user_bitrixCreateInput[] {

  const mapUser = (u: IUser): user_bitrixCreateInput => ({
    bitrix_id: u.ID,
    email: u.EMAIL!,
    name: u.NAME!,
    last_name: u.LAST_NAME,
    second_name: u.SECOND_NAME,
    personal_photo: u.PERSONAL_PHOTO,
    portal: { connect: { id: portal_id } },
    personal_phone: u.PERSONAL_PHONE,
    work_phone: u.WORK_PHONE,
    work_position: u.WORK_POSITION
  });

  if (Array.isArray(user)) {
    return user.map(mapUser);
  }

  return mapUser(user);
}

export function companyMapUpsertPrisma(portal_id : number, users : user_bitrix[], ...companys : NewBitrixCompany[]) : companyCreateInput[]{
    return companys.map(b =>{
        const company : companyCreateInput = {
            bitrix_id : b.id.toString(),
            title : b.title,
            company_type : b.typeId,
            industry : b.industry,
            opened : b.opened === 'Y',
            is_my_company : b.isMyCompany === 'Y',
            date_create : b.createdTime,
            date_modify : b.updatedTime,
            portal : {connect : {id : portal_id}},
        }
        const assigned = users.find(u => u.bitrix_id === b.assignedById.toString());
        if(assigned) company.user_bitrix_company_assigned_by_idTouser_bitrix = {connect : {id : assigned.id}};
        const modify = users.find(u => u.bitrix_id === b.updatedBy.toString());
        if(modify) company.user_bitrix_company_modify_by_idTouser_bitrix = {connect : {id : modify.id}};
        const created = users.find(u => u.bitrix_id === b.createdBy.toString());
        if(created) company.user_bitrix_company_created_by_idTouser_bitrix = {connect : {id : created.id}};
        return company
    })
}

export function requisiteMapUpsertPrisma(portal_id : number, company_id : number, ...requisites : IRequisite[]) : requisiteCreateInput[] {
    return requisites.map(r =>{
        return {
            bitrix_id : r.ID,
            name : r.NAME,
            active : r.ACTIVE === 'Y',
            sort : r.SORT.toString(),
            inn : r.RQ_INN,
            kpp : r.RQ_KPP,
            ogrn : r.RQ_OGRN,
            company_name : r.NAME,
            company_full_name : r.NAME,
            company : {connect : {id : company_id}},
            portal : {connect : {id : portal_id}}
        } as requisiteCreateInput
    })
}

export function addressMapUpsertPrisma(portal_id : number, company_id : number, ...addresses : IAddress[] ) : addressCreateInput[]{
    return addresses.map(a => {
        return {
            entity_type_id : a.ENTITY_TYPE_ID,
            address_1 : a.ADDRESS_1,
            address_2 : a.ADDRESS_2,
            city : a.CITY,
            postal_code : a.POSTAL_CODE,
            region : a.REGION,
            province : a.PROVINCE,
            country :a.COUNTRY,
            company : {connect : {id : company_id}},
            type_id : a.TYPE_ID.toString(),
            portal : {connect : {id : portal_id}}
        } as addressCreateInput
    })
}
export function contactMapUpsertPrisma(portal_id : number, company_id : number, users : user_bitrix[], ...contacts : IContact[]) : ContactWithData[]{
    return contacts.map(cc => {
        const contact : contactCreateInput = {
            bitrix_id : cc.ID,
            name : cc.NAME,
            second_name : cc.SECOND_NAME,
            last_name : cc.LAST_NAME,
            post : cc.POST,
            type_id : cc.TYPE_ID,
            opened : cc.OPENED === "Y",
            date_create : cc.DATE_CREATE,
            date_modify : cc.DATE_MODIFY,
            portal : {connect : {id : portal_id}},
            company : {connect : {id : company_id}}   
        }
        const assigned = users.find(u => u.bitrix_id === cc.ASSIGNED_BY_ID);
        if(assigned) contact.user_bitrix_contact_assigned_by_idTouser_bitrix = {connect : {id : assigned.id}};
        const modify = users.find(u => u.bitrix_id === cc.MODIFY_BY_ID);
        if(modify) contact.user_bitrix_contact_modify_by_idTouser_bitrix = {connect : {id : modify.id}};
        const created = users.find(u => u.bitrix_id === cc.CREATED_BY_ID);
        if(created) contact.user_bitrix_contact_created_by_idTouser_bitrix = {connect : {id : created.id}};
        const data : ContactWithData = {contact : contact}
        if(cc.EMAIL) data.emails = cc.EMAIL;
        if(cc.PHONE) data.phones = cc.PHONE;
        return data
    })
}

export function emailsPhonesMapUpsertPrisma<T extends contact_emailCreateInput | contact_phonesCreateInput>(portal_id : number, contact_id : number, ...data : IContactInfo[]) : T[] {
    return data.map(e => {
        return {
            type_id : e.TYPE_ID,
            value : e.VALUE,
            bitrix_id : e.ID,
            value_type : e.VALUE_TYPE,
            portal : {connect : {id : portal_id}},
            contact : {connect : {id : contact_id}}
        } as T
    })
}

export function invocieMapUpsertPrisma(portal_id : number, company_id : number, users : user_bitrix[], ...invoice : Invoice[]) : invoiceCreateInput[]{
    return invoice.map(ii => {
        const i = {
            bitrix_id : ii.id.toString(),
            title : ii.title,
            created_time : ii.createdTime,
            updated_time : ii.updatedTime,
            opened : ii.opened === "Y",
            begindate : ii.begindate,
            closedate : ii.closedate,
            category_id : ii.categoryId?.toString(),
            stage_id : ii.stageId,
            currency_id : ii.currencyId,
            opportunity : ii.opportunity,
            last_activty_time : ii.lastActivityTime,
            company : {connect : {id : company_id}},
            portal : {connect : {id : portal_id}},
        } as invoiceCreateInput
        const assigned = users.find(u => u.bitrix_id == ii.assignedById);
        if(assigned) i.user_bitrix_invoice_assigned_by_idTouser_bitrix = {connect : {id : assigned.id}};
        const modify = users.find(u => u.bitrix_id == ii.updatedBy);
        if(modify) i.user_bitrix_invoice_updated_byTouser_bitrix = {connect : {id : modify.id}};
        const created = users.find(u => u.bitrix_id == ii.createdBy);
        if(created) i.user_bitrix_invoice_created_byTouser_bitrix = {connect : {id : created.id}};
        const lastactivy = users.find(u => u.bitrix_id == ii.lastActivityBy);
        if(lastactivy) i.user_bitrix_invoice_last_activty_byTouser_bitrix ={connect : {id : lastactivy.id}};
        return i
    })
}

export function contractGetMapPrisma(data : contractPrismaGet) : IContract;
export function contractGetMapPrisma(data : contractPrismaGet[]) : IContract[]
export function contractGetMapPrisma(data: contractPrismaGet | contractPrismaGet[]): IContract | IContract[] {
    if(Array.isArray(data)){
        return data.map(c => {return Contract.parse({
                id : c.id,
                name : c.name,
                company_id : c.company_id,
                status : c.contract_status.name,
                index : c.index,
                date_begin : c.date_begin.toString(),
                date_close : c.date_close.toString(),
                org_name : c.org_name
            } as IContract)} )
    }
    else return Contract.parse({
        id : data.id,
        name : data.name,
        company_id : data.company_id,
        status : data.contract_status.name,
        index : data.index,
        date_begin : data.date_begin.toString(),
        date_close : data.date_close.toString(),
        org_name : data.org_name
    } as IContract)
}

export function contractInputMapPrisma(data : IContractBitrix, portal_id : number, myCompany? : ICacheCompany) : contractCreateInput
export function contractInputMapPrisma(data : IContractPost, portal_id : number, bitrix_id : number) : contractCreateInput
export function contractInputMapPrisma(data : IContractPost | IContractBitrix, portal_id : number, bitrix_id_myCompany? : number | ICacheCompany) : contractCreateInput {
    const bitrix_id = typeof bitrix_id_myCompany === "number" ? bitrix_id_myCompany : undefined
    const resolvedMyCompany = typeof bitrix_id_myCompany === "object" ? bitrix_id_myCompany : undefined
   if("bitrix_id" in data){
     const data2 = {
        name : data.name,
        contract_status : {connect : {id : data.status}},
        company :{connect : {id : data.company_id, bitrix_id_portal_id : {bitrix_id : data.bitrix_id , portal_id : portal_id}}},
        index : data.index,
        date_begin : data.date_begin,
        date_close : data.date_close,
        org_name : data.org_name,
        bitrix_id : bitrix_id,
        portal : {connect : {id : portal_id}}
    } as contractCreateInput
    if(!data.bitrix_id || !portal_id) delete data2.company.connect?.bitrix_id_portal_id
    if(!data.company_id) delete data2.company.connect?.id;
    return data2
   }else{
    const a = data as IContractBitrix
    const data2 ={
        name : a.title,
        contract_status : {connect : {id : 1}}, //Временная затычка
        company : {connect : {bitrix_id_portal_id : {bitrix_id : a.companyId?.toString(), portal_id : portal_id}}},
        index : "0", //Временная затычка,
        date_begin : a.ufCrm7_1772107131118,
        date_close : a.ufCrm7_1772107148271,
        org_name : resolvedMyCompany?.title ?? "МИНТА ООО",
        bitrix_id : a.id,
        portal : {connect : {id : portal_id}}
    } as contractCreateInput
    return data2
   }
}
export function contractMapBitrix(data : IContractUpdate) : IContractBitrix
export function contractMapBitrix(data : IContractPost, user_id: number, company_id? : number) : IContractBitrix
export function contractMapBitrix(data : IContractPost | IContractUpdate, user_id? : number, company_id? : number) : IContractBitrix{
     const _data = {
        title : data.name,
        opened : "N",
        assignedById : user_id,
        companyId : "bitrix_id" in data ? data.bitrix_id : undefined,
        currencyId : "RUB",
        mycompanyId : company_id,
        ufCrm7_1772107131118 : data.date_begin,
        ufCrm7_1772107148271 : data.date_close,
        ufCrm7_1772523967924 : "N",
        ufCrm7_1772524025251 : data.date_begin,
        ufCrm7_1773131357728 : "N"
     } as IContractBitrix
     return _data
}

export function contractUpdateMapPrisma(data : IContractUpdate) : contractUpdateInput{
    const contract = {
        name : data.name,
        index : data.index,
        date_begin : data.date_begin,
        date_close : data.date_close,
        org_name : data.org_name
    } as contractUpdateInput
    if(data.company_id) contract.company = {connect : {id : data.company_id}}
    if(data.status) contract.contract_status = {connect : {id : data.status}}
    return contract
}

export function vatsInputMapPrisma(data : IVatsPost) : vatsCreateInput{
    return {
        additional_users : data.additional_users,
        active : data.active,
        price : data.price,
        duration : data.duration,
        title : data.title,
        contract : {connect : {id : data.contract_id}},
        tariff : {connect : {id : data.tarrif_id}}
    } as vatsCreateInput
}

export function vatsUpdateMapPrisma(data : IVatsUpdate) : vatsUpdateInput{
    const vats = {
        additional_users : data.additional_users,
        active : data.active,
        price : data.price,
        duration : data.duration,
        title : data.title,
    } as vatsUpdateInput

    if(data.contract_id) vats.contract =  {connect : {id : data.contract_id}}
    if(data.tarrif_id) vats.tariff = {connect : {id : data.tarrif_id}}

    return vats
}
export function voiceRobotInputMapPrisma(data : IVoiceRobotPost) : voice_robotCreateInput{
    const robot = {
        lines : data.lines,
        active : data.active,
        price : data.price,
        title : data.title,
    } as voice_robotCreateInput
    if(data.contract_id) robot.contract = {connect : {id : data.contract_id}}
    if(data.tarrif_id) robot.tariff = {connect : {id : data.tarrif_id}}
    return robot
}

export function voiceRobotPatchMapPrimsa(data : IVoiceRobotUpdate) : voice_robotUpdateInput{
    const robot = {
        lines : data.lines,
        active : data.active,
        price : data.price,
        title : data.title,
    } as voice_robotUpdateInput
    if(data.contract_id) robot.contract = {connect : {id : data.contract_id}}
    if(data.tarrif_id) robot.tariff = {connect : {id : data.tarrif_id}}
    return robot
}
export function chatBotInputUpdateMapPrisma(data : IChatBotUpdate) : chat_botUpdateInput;
export function chatBotInputUpdateMapPrisma(data : IChatBotPost) : chat_botCreateInput;
export function chatBotInputUpdateMapPrisma(data : IChatBotPost | IChatBotUpdate) : chat_botCreateInput | chat_botUpdateInput{
    const chat = {
        lines_count : data.lines_count,
        active : data.active,
        price : data.price,
        title : data.title,
    } as chat_botCreateInput | chat_botUpdateInput

    if(data.contract_id) chat.contract = {connect : {id : data.contract_id}}
    if(data.tarrif_id) chat.tariff = {connect : {id : data.tarrif_id}}

    return chat
}

export type chatBotGetPrisma = {
    chat_bot_messengers: {
        messengers: {
            name: string;
        };
    }[];
} & {
    id: number;
    active: boolean;
    price: number;
    title : string
    contract_id: number | null;
    lines_count: number;
    tariff_id: number | null;
}

export function chatBotGetMapPrisma(data : chatBotGetPrisma) : IChatBot;
export function chatBotGetMapPrisma(data : chatBotGetPrisma[]) : IChatBot[]
export function chatBotGetMapPrisma(data: chatBotGetPrisma | chatBotGetPrisma[]): IChatBot | IChatBot[] {
    if(Array.isArray(data)){
        return data.map(c => {return{
                id : c.id,
                active : c.active,
                price : c.price,
                title : c.title,
                contract_id : c.contract_id,
                lines_count : c.lines_count,
                tarrif_id : c.tariff_id,
                messengers : c.chat_bot_messengers.map(m => m.messengers.name)
            } as IChatBot} )
    }
    else return {
                id : data.id,
                active : data.active,
                price : data.price,
                title : data.title,
                contract_id : data.contract_id,
                lines_count : data.lines_count,
                tarrif_id : data.tariff_id,
                messengers : data.chat_bot_messengers.map(m => m.messengers.name)
    } as IChatBot
}


// export function chatBotUpdateMapPrisma (data : IChatBotUpdate) : chat_botUpdateInput{
//     return {
//         lines_count : data.lines_count,
//         active : data.active,
//         price : data.price,
//         tariff : {connect : {id : data.tarrif_id}},
//         contract : {connect : {id : data.contract_id}},
        
//     } as chat_botUpdateInput
// }

export function autoinformationInputMapPrisma(data : IAutoinformationPost) : autoinformation_moduleCreateInput
export function autoinformationInputMapPrisma(data : IAutoinformationFilterUpdate) : autoinformation_moduleUpdateInput
export function autoinformationInputMapPrisma(data : IAutoinformationPost | IAutoinformationFilterUpdate) : autoinformation_moduleCreateInput | autoinformation_moduleUpdateInput{
    const auto = {
        quantity : data.quantity,
        price : data.price,
        title : data.title,
        active : data.active,
        
    } as autoinformation_moduleCreateInput | autoinformation_moduleUpdateInput

    if(data.contract_id) auto.contract = {connect : {id : data.contract_id}}
    if(data.tarrif_id) auto.tariff = {connect : {id : data.tarrif_id}}
    if(data.type_id) auto.autoinformation_type = {connect : {id : data.type_id}}

    return auto
}

export function webformInputUpdateMapPrisma(data : IWebFormFilterUpdate) : webformUpdateInput;
export function webformInputUpdateMapPrisma(data : IWebformPost) : webformCreateInput;
export function webformInputUpdateMapPrisma(data : IWebFormFilterUpdate | IWebformPost) : webformCreateInput | webformUpdateInput{
    const webform = {
        active : data.active,
        price : data.price,
        title : data.title,
    }   as webformCreateInput | webformUpdateInput

    
    if(data.contract_id) webform.contract = {connect : {id : data.contract_id}}
    if(data.tarrif_id) webform.tariff = {connect : {id : data.tarrif_id}}

    console.log(webform)

    return webform
}

export type webformGetPrisma = {
    webform_webform_type: {
        webform_type: {
            name: string;
        };
    }[];
} & {
    id: number;
    contract_id: number | null;
    tarrif_id: number;
    active: boolean | null;
    price: number;
    title: string;
}

export function webformGetMapPrisma(data : webformGetPrisma) : IWebform;
export function webformGetMapPrisma(data : webformGetPrisma[]) : IWebform[];
export function webformGetMapPrisma(data : webformGetPrisma | webformGetPrisma[]) : IWebform | IWebform[]{
    if(Array.isArray(data)){
        return data.map(c => {return{
                id : c.id,
                active : c.active,
                price : c.price,
                title : c.title,
                contract_id : c.contract_id,
                tarrif_id : c.tarrif_id,
                integrations : c.webform_webform_type.map(m => m.webform_type.name)
            } as IWebform} )
    }
    else return {
                id : data.id,
                active : data.active,
                price : data.price,
                title : data.title,
                contract_id : data.contract_id,
                tarrif_id : data.tarrif_id,
                integrations : data.webform_webform_type.map(m => m.webform_type.name)
    } as IWebform
}


export function connectionMapPostPrisma(data : IConnectionPost, portal_id : number) : connectionCreateInput{
    const con =  {
        title : data.title,
        source : data.source,
        connection_status : {connect : {id : data.status_id}},
        connection_type : {connect : {id : data.type_id}}
    } as connectionCreateInput
    if(typeof data.company_id === "string") con.company = {connect : {bitrix_id_portal_id : {bitrix_id : data.company_id , portal_id : portal_id}}};
    else con.company = {connect : {id : data.company_id}};
    return con
}
