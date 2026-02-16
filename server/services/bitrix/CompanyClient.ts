import axios, { AxiosInstance } from "axios";
import { bitrixResponse } from "./bitrixAPI";
import { IAddress, ICompnany, IContact, Invoice, IRequisite } from "../models";

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
    } //добавить интенцирапторы

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