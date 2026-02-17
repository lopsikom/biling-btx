import { IAddress, ICompnany, IContact, IContactInfo, Invoice, IRequisite, IUser } from "../services/models";
import { user_bitrix } from "../services/models/generated/prisma/client";
import { addressCreateInput, companyCreateInput, contact_emailCreateInput, contact_phonesCreateInput, contactCreateInput, invoiceCreateInput, requisiteCreateInput, user_bitrixCreateInput } from "../services/models/generated/prisma/models";
import { ContactWithData } from "./prisma/postContact";

export function userMapUpsertPrisma(portal_id : number, ...user : IUser[]) : user_bitrixCreateInput[]{
    return user.map( (u) => {
      return {
        bitrix_id : u.ID,
        email : u.EMAIL!,
        name : u.NAME!,
        last_name : u.LAST_NAME,
        second_name : u.SECOND_NAME,
        personal_photo : u.PERSONAL_PHOTO,
        portal : {connect : {id : portal_id}},
        personal_phone : u.PERSONAL_PHONE,
        work_phone : u.WORK_PHONE,
        work_position : u.WORK_POSITION
      }
    })
}

export function companyMapUpsertPrisma(portal_id : number, users : user_bitrix[], ...companys : ICompnany[]) : companyCreateInput[]{
    return companys.map(b =>{
        const company : companyCreateInput = {
            bitrix_id : b.ID,
            title : b.TITLE,
            company_type : b.COMPANY_TYPE,
            industry : b.INDUSTRY,
            opened : b.OPENED === 'Y',
            is_my_company : b.IS_MY_COMPANY === 'Y',
            date_create : b.DATE_CREATE,
            date_modify : b.DATE_MODIFY,
            portal : {connect : {id : portal_id}},
        }
        const assigned = users.find(u => u.bitrix_id === b.ASSIGNED_BY_ID);
        if(assigned) company.user_bitrix_company_assigned_by_idTouser_bitrix = {connect : {id : assigned.id}};
        const modify = users.find(u => u.bitrix_id === b.MODIFY_BY_ID);
        if(modify) company.user_bitrix_company_modify_by_idTouser_bitrix = {connect : {id : modify.id}};
        const created = users.find(u => u.bitrix_id === b.CREATED_BY_ID);
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