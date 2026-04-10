import getPortalPrisma, { portalPrisma } from "../utils/prisma/getPortal";
import postCompanyPrisma from "../utils/prisma/postCompany";
import upsertRequisites from "../utils/prisma/postRequisites";
import postRequisites from "../utils/prisma/postRequisites";
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
import { upsertUserPrisma } from "../utils/prisma/UserBitrix";


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
            const token = await getBitrixTokenByRefresh(id)
            if(!token) return false
            const companysBitrix = (await bitrixAPI.getCompanies(domain,token.accessToken)).result.items
            const usersBitrix =  (await bitrixAPI.getBitrixUsers(domain, token.accessToken)).result
            if(usersBitrix.length < 0) return false
            const mappedUsers = await upsertUserPrisma(id, userMapUpsertPrisma(id, usersBitrix));
            const companyClients = await Promise.all(companysBitrix.map(async b => { 
                try{
                const com = (await postCompanyPrisma( id, ...companyMapUpsertPrisma(id, mappedUsers, b)))[0];
                console.log(`Company '${b.title}' added`)
                const company = new companyClient(domain, id, b.id.toString())
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
                }catch(e){
                    console.error(`Error added company '${b.title}\nError:\n${e}`)
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
    set setPortals(data : Record<string, number>){
        this.portals = data;
    }
}
const syncServiceObj = new syncService()

export default syncServiceObj