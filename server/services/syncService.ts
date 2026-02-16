import getPortalPrisma from "../utils/prisma/getPortal";
import postCompanyPrisma from "../utils/prisma/postCompany";
import upsertRequisites from "../utils/prisma/postRequisites";
import postRequisites from "../utils/prisma/postRequisites";
import upsertUserPrisma from "../utils/prisma/postUser";
import bitrixAPI from "./bitrix/bitrixAPI";
import companyClient from "./bitrix/CompanyClient";
import { addressCreateInput, contact_emailCreateInput, contact_phonesCreateInput, invoiceCreateInput, requisiteCreateInput } from "~~/server/services/models/generated/prisma/models";
import { Prisma } from "./models/generated/prisma/client";
import { formToJSON } from "axios";
import { ContactWithData, upsertContactWithData } from "../utils/prisma/postContact";
import upsertAddress from "../utils/prisma/postAddress";
import upsertInvoice from "../utils/prisma/postInvoice";


export class syncService{
    private portals : Record<string, number> = {}

    constructor(portals? : Record<string, number>){
        if(portals) this.portals =  portals;
    }
    async installSync(portal : string | number) : Promise<boolean>{
        try{
            let id : number;
            let domain : string;
            if(typeof portal === "string"){
                id = this.portals[portal];
                domain = portal;
            }
            else{
                id = portal;
                const data = Object.entries(this.portals)
                .find(([_, v]) => v === portal)?.[0];
                if(!data) return false;
                domain = data;
            }
            const token = await getBitrixTokenByPortal(id)
            if(!token) return false
            const companysBitrix = (await bitrixAPI.getCompanies(domain,token.accessToken)).result
            const usersBitrix = await (await bitrixAPI.getBitrixUsers(domain, token.accessToken)).result

            if(usersBitrix.length < 0) return false
            const mappedUsers = await Promise.all(usersBitrix.map(async u => {
                const user = await upsertUserPrisma(id, {
                    bitrix_id : u.ID,
                    email : u.EMAIL!,
                    name : u.NAME!,
                    last_name : u.LAST_NAME,
                    second_name : u.SECOND_NAME,
                    personal_photo : u.PERSONAL_PHOTO,
                    portal : {connect : {id : id}},
                    personal_phone : u.PERSONAL_PHONE,
                    work_phone : u.WORK_PHONE,
                    work_position : u.WORK_POSITION
                })
                return user[0]
            }))
            const companyClients = await Promise.all(companysBitrix.map(async b => { 
                try{
                    const com = await postCompanyPrisma( id, {
                    bitrix_id : b.ID.toString(),
                    title : b.TITLE,
                    company_type : b.COMPANY_TYPE,
                    industry : b.INDUSTRY,
                    opened : b.OPENED === 'Y',
                    is_my_company : b.IS_MY_COMPANY === 'Y',
                    date_create : b.DATE_CREATE,
                    date_modify : b.DATE_MODIFY,
                    portal : {connect : {id : id}},
                    user_bitrix_company_assigned_by_idTouser_bitrix : {connect : {id : mappedUsers.find(u => u.bitrix_id === b.ID)?.id}},
                    user_bitrix_company_modify_by_idTouser_bitrix : {connect : {id : mappedUsers.find(u => u.bitrix_id === b.ID)?.id}},
                    user_bitrix_company_created_by_idTouser_bitrix : {connect : {id : mappedUsers.find(u => u.bitrix_id === b.ID)?.id}}
                })
                console.log(`Company '${b.TITLE}' added`)
                const company = new companyClient(domain, id, b.ID)
                const r = await company.getRequisites()
                await upsertRequisites(id, ...r.result.map(m => {
                    return {
                        bitrix_id : m.ID,
                        name : m.NAME,
                        active : m.ACTIVE === 'Y',
                        sort : m.SORT.toString(),
                        inn : m.RQ_INN,
                        kpp : m.RQ_KPP,
                        ogrn : m.RQ_OGRN,
                        company_name : m.NAME,
                        company_full_name : m.NAME,
                        raw_json : JSON.stringify(r.result),
                        company : {connect : {id : com[0]!.id}},
                        portal : {connect : {id : id}}
                    } as requisiteCreateInput
                }))
                const addresses = await company.getAddress()
                await upsertAddress(id, ...addresses.result.map(a =>{
                        return {
                            entity_type_id : a.ENTITY_TYPE_ID,
                            address_1 : a.ADDRESS_1,
                            address_2 : a.ADDRESS_2,
                            city : a.CITY,
                            postal_code : a.POSTAL_CODE,
                            region : a.REGION,
                            province : a.PROVINCE,
                            country :a.COUNTRY,
                            company : {connect : {id : com[0].id}},
                            address_type : {connect : {id : a.TYPE_ID}},
                            portal : {connect : {id : id}}
                        } as addressCreateInput
                    }))
                const c = await company.getContacts()
                const data : ContactWithData[] = c.result.map(cc => {
                    return {
                        contact : {
                            bitrix_id : cc.ID,
                            name : cc.NAME,
                            second_name : cc.SECOND_NAME,
                            last_name : cc.LAST_NAME,
                            post : cc.POST,
                            type_id : cc.TYPE_ID,
                            opened : cc.OPENED === "Y",
                            date_create : cc.DATE_CREATE,
                            date_modify : cc.DATE_MODIFY,
                            user_bitrix_contact_assigned_by_idTouser_bitrix : {connect :{id : mappedUsers.find(u => u.bitrix_id === b.ID)}.id},
                            user_bitrix_contact_created_by_idTouser_bitrix : {connect :{id : mappedUsers.find(u => u.bitrix_id === b.ID)}.id},
                            user_bitrix_contact_modify_by_idTouser_bitrix : {connect :{id : mappedUsers.find(u => u.bitrix_id === b.ID)}.id},
                            portal : {connect : {id : id}},
                            company : {connect : {id :com[0]!.id}}

                        },
                        emails : cc.EMAIL?.map(e => {
                            return {
                                type_id : e.TYPE_ID,
                                value : e.VALUE,
                                bitrix_id : e.ID,
                                contact_info_type : {connect : {id : e.VALUE_TYPE}},
                                portal : {connect : {id : id}},
                                contact : {connect : {id : com[0].id}}

                            } as contact_emailCreateInput
                        }),
                        phones : cc.PHONE?.map(p => {
                            return {
                                type_id : p.TYPE_ID,
                                value : p.VALUE,
                                bitrix_id : p.ID,
                                contact_info_type : {connect : {id : p.VALUE_TYPE}},
                                portal : {connect : {id : id}},
                                contact : {connect : {id : com[0].id}}
                            } as contact_phonesCreateInput
                        })
                    } as ContactWithData
                })
                await upsertContactWithData(id, ...data);
                const i = await company.getInvoice()
                upsertInvoice(id, ...i.result.map(ii => {
                        return {
                            bitrix_id : ii.id,
                            title : ii.title,
                            created_time : ii.createdTime,
                            updated_time : ii.updatedTime,
                            opened : ii.opened,
                            begindate : ii.begindate,
                            closedate : ii.closedate,
                            category_id : ii.categoryId,
                            stage_id : ii.stageId,
                            currency_id : ii.currencyId,
                            opportunity : ii.opportunity,
                            last_activty_time : ii.lastActivityTime,
                            user_bitrix_invoice_assigned_by_idTouser_bitrix : {connect :{id : mappedUsers.find(u => u.bitrix_id === b.ID)}.id},
                            user_bitrix_invoice_created_byTouser_bitrix : {connect :{id : mappedUsers.find(u => u.bitrix_id === b.ID)}.id},
                            user_bitrix_invoice_last_activty_byTouser_bitrix : {connect :{id : mappedUsers.find(u => u.bitrix_id === b.ID)}.id},
                            user_bitrix_invoice_updated_byTouser_bitrix : {connect :{id : mappedUsers.find(u => u.bitrix_id === b.ID)}.id},
                            company : {connect : {id : com[0].id}},
                            portal : {connect : {id : id}},
                        } as invoiceCreateInput
                    }))
                    console.log("AAAAAAAAAAAA")
                }catch(e){
                    console.log(`Error added company '${b.TITLE}\nError:\n${e}`)
                    return false
                }
            }))
            if(companyClients.length < 0) return false;
            return true;  


        }catch(e){
            console.log(e)
            return false
        }
    }
}

export default new syncService() //Занести в плагин