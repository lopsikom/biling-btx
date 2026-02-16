import axios, { AxiosInstance } from "axios";
import bitrixAPI, { bitrixResponse } from "./bitrixAPI";
import { IAddress, ICompnany, IContact, Invoice, IRequisite } from "../models";
import { config } from "process";

export default class companyClient{
    domain : string;
    bitrix_id : number;
    portal_id : number;
    axiosClient : AxiosInstance;
    constructor(domainBitrix : string, id : number, bitrix_id : number){
        this.domain = domainBitrix;
        this.portal_id = id;
        this.bitrix_id = bitrix_id;
        this.axiosClient = axios.create({baseURL : `https://${this.domain}`, headers : {
            'Content-Type': 'application/json'
        }});
        this.axiosClient.interceptors.request.use(async (config) => { //Поменять логику токенов
            if(!config.params.auth) {
                const portal = await getPortal({id : this.portal_id})
                console.log(portal);
                if(!portal || !portal.refresh_token) return config
                const token = await bitrixAPI.getAccesToken(portal.client_id, portal.client_secret, portal.refresh_token);
                console.log(token);
                if(!token) return config
                config.params.auth = token.access_token;
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
                    "POST"
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
        return response.data as bitrixResponse<Invoice[]>
    }
    

}