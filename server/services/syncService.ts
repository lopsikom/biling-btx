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
import { getBitrixTokenByRefresh } from "../utils/getBitrixToken";
import { addressMapUpsertPrisma, companyMapUpsertPrisma, contactMapUpsertPrisma, invocieMapUpsertPrisma, requisiteMapUpsertPrisma, userMapUpsertPrisma } from "../utils/mappers";


export class syncService{
    private portals : Record<string, number> = {}
    constructor(portals? : Record<string, number>){
        if(portals) this.portals =  portals;
    }
    async installSync(portal : string | number) : Promise<boolean>{
        try{
            let id : number;
            let domain : string;
            console.log("sync 0")
            if(typeof portal === "string"){
                id = this.portals[portal];
                domain = portal;
            }
            else{
                id = portal;
                const data = Object.entries(this.portals)
                .find(([_, v]) => v === portal)?.[0];
                console.log("sync 1")
                if(!data) return false;
                domain = data;
            }
            const token = await getBitrixTokenByRefresh(id)
            console.log("sync 2")
            if(!token) return false
            const companysBitrix = (await bitrixAPI.getCompanies(domain,token.acessToken)).result
            const usersBitrix =  (await bitrixAPI.getBitrixUsers(domain, token.acessToken)).result
            console.log("sync 3")
            if(usersBitrix.length < 0) return false
            console.log("sync 4")
            const mappedUsers = await upsertUserPrisma(id, ...userMapUpsertPrisma(id, ...usersBitrix));
            const companyClients = await Promise.all(companysBitrix.map(async b => { 
                try{
                const com = (await postCompanyPrisma( id, ...companyMapUpsertPrisma(id, mappedUsers, b)))[0];
                console.log(`Company '${b.TITLE}' added`)
                const company = new companyClient(domain, id, b.ID)
                const r = (await company.getRequisites()).result
                await upsertRequisites(id, ...requisiteMapUpsertPrisma(id, com.id, ...r))
                const addresses = await company.getAddress()
                const ad = await upsertAddress(id, ...addressMapUpsertPrisma(id, com.id, ...addresses.result))
                ad.forEach(add => console.log("Added address " + add.address_1))
                const c = await company.getContacts()
                const cc = await upsertContactWithData(id, ...contactMapUpsertPrisma(id, com.id, mappedUsers, ...c.result));
                cc.forEach(ccc => console.log(`Added contact ` + ccc.contact.name))
                const i = await company.getInvoice()
                const ii = await upsertInvoice(id, ...invocieMapUpsertPrisma(id, com.id, mappedUsers, ...i.result.items))
                ii.forEach(iii => console.log("Added invoice " + iii.title))
                console.log("sync 5")
                }catch(e){
                    console.error(`Error added company '${b.TITLE}\nError:\n${e}`)
                    return false
                }
            }))
            if(companyClients.length < 0) return false;
            console.log("install sync finished")
            return true;  


        }catch(e){
            console.error(e)
            return false
        }
    }
}

export default new syncService({"b24-sxsxo9.bitrix24.ru" : 4, "b24-shukt8.bitrix24.ru": 6, "crm.minta24.ru" : 7}) //Занести в плагин