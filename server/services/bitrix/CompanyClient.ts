import axios, { AxiosInstance } from "axios";
import bitrixAPI, { bitrixResponse } from "./bitrixAPI";
import { IAddress, IBitrixToken, ICompnany, IContact, Invoice, IRequisite } from "../models";
import { portalPrisma } from "~~/server/utils/prisma/getPortal";
import { redisClient } from "../redis";

export default class companyClient{
    domain : string;
    bitrix_id : string;
    portal_id : number;
    axiosClient : AxiosInstance;
    constructor(domainBitrix : string, id : number, bitrix_id : string){
        this.domain = domainBitrix;
        this.portal_id = id;
        this.bitrix_id = bitrix_id;
        this.axiosClient = axios.create({baseURL : `https://${this.domain}`, headers : {
            'Content-Type': 'application/json'
        }});
        this.axiosClient.interceptors.request.use(async (config) => { //Поменять логику токенов
            if(!config.params.auth) {
                const parseToken = await redisClient.get(`token:${this.portal_id}`);
                console.log("parseToken ", parseToken)
                if(parseToken) {
                    const token = JSON.parse(parseToken) as IBitrixToken;
                    config.params.auth = token.access_token;
                    return config;
                }
                const parsePortal = await redisClient.get(`portal:${this.portal_id}`)
                if(!parsePortal) {
                    const portal = await getPortal({id : this.portal_id})
                    if(!portal || !portal.refresh_token) return config;
                    redisClient.set(`portal:${this.portal_id}`, JSON.stringify(portal));
                    const token = await bitrixAPI.getAccesToken(portal.client_id, portal.client_secret, portal.refresh_token);
                    if(!token) return config
                    redisClient.set(`token:${this.portal_id}`, JSON.stringify(token), "EX", 3000);
                    config.params.auth = token.access_token;
                    return config
                }
                const portal = JSON.parse(parsePortal)
                const token = await bitrixAPI.getAccesToken(portal.client_id, portal.client_secret, portal.refresh_token);
                if(!token) return config
                redisClient.set(`token:${this.portal_id}`, JSON.stringify(token), "EX", 3000);
                config.params.auth = token.access_token;
                return config
            }
            return config
        })
    }   

    async getCompanyInfo(){
        const response = await this.axiosClient.get('/rest/crm.company.get', {
            params: {
                ID : this.bitrix_id,
            }
        });
        return response.data as bitrixResponse<ICompnany>;
    }
    async getRequisites(){
        const response = await this.axiosClient.get('/rest/crm.requisite.list', {
            params: {
                filter : {
                    ENTITY_TYPE_ID : 4,
                    ENTITY_ID : this.bitrix_id
                }
            }
        })
        return response.data as bitrixResponse<IRequisite[]>
    }
    async getAddress() {
        const response = await this.axiosClient.get('/rest/crm.address.list', {
            params : {
                filter : {
                    ENTITY_TYPE_ID : 4,
                    ENTITY_ID : this.bitrix_id
                }
            }
        })
        return response.data as bitrixResponse<IAddress[]>
    }
    async getContacts(){
        const response = await this.axiosClient.get('/rest/crm.contact.list', {
            params : {
                filter : {
                    COMPANY_ID : this.bitrix_id
                },
                select : [
                    "ID",
                    "NAME",
                    "LAST_NAME",
                    "SECOND_NAME",
                    "PHONE",
                    "EMAIL",
                    "POST",
                    "DATE_CREATE",
                    "DATE_MODIFY",
                    "CREATED_BY_ID",
                    "ASSIGNED_BY_ID",
                    "MODIFY_BY_ID"
                ]
            }
        })
        return response.data as bitrixResponse<IContact[]>
    }
    async getInvoice(){
        const response = await this.axiosClient.get('/rest/crm.item.list',{
            params: {
                entityTypeId : 31,
                filter : {
                    companyId : this.bitrix_id
                }
            }
        })
        return response.data as bitrixResponse<{items : Invoice[]}>
    }
    

}

export async function initCompanyClient(bitrix_id : number, portal : number | portalPrisma){
    let portalPrisma : portalPrisma
    if(typeof portal === "number") portalPrisma = await getPortal({id : portal})
    else portalPrisma = portal
    if(!portalPrisma || !portalPrisma.refresh_token) return 
    const token = await bitrixAPI.getAccesToken(portalPrisma.client_id, portalPrisma.client_secret, portalPrisma.refresh_token);
    const company = await bitrixAPI.getCompany(bitrix_id, token.access_token, portalPrisma.domain);
    const companyPrsima = await postCompany(portalPrisma.id, ...companyMapUpsertPrisma(portalPrisma.id, [], company.result));
    return new companyClient(portalPrisma.domain, companyPrsima[0].id, bitrix_id.toString())
}