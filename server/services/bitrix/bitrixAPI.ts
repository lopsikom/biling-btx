import axios, {AxiosInstance} from "axios"
import { AnyProduct, IAppInfo, IBitrixToken, ICatalogProduct, ICompnany, IContractBitrix, IProductCatalogCreate, IProductRow, IResponseArrayNewBitrix, IResponseNewBitrix, IUser, NewBitrixCompany } from "../models"
import { bitrixTokens } from "~~/server/utils/getBitrixToken"
import { config } from "process"
import { useNuxtApp } from "nuxt/app"
import { b24RateLimiter, extractHost } from "~~/server/utils/rateLimiter"

export interface bitrixResponse<T>{
    result : T,
    time : {
        start : number,
        finish : number,
        duration : number,
        processing : number,
        date_start : string,
        date_finish : string
    }
}

export class bitrixAPI {
    private AxiosClient : AxiosInstance
    private AuthURI : string
    constructor(){
        this.AuthURI = useRuntimeConfig().AuthUri + "rest/";
        console.log(this.AuthURI);
        this.AxiosClient = axios.create({headers: {
            'Content-Type': 'application/json'
        }});
        this.AxiosClient.interceptors.request.use(async (cfg) => {
            await b24RateLimiter.acquire(extractHost(cfg));
            return cfg;
        });
        this.AxiosClient.interceptors.response.use((response) => response,(error) => {
            const { response, request, config, message } = error;

            console.group(`❌ ERROR [${config?.method?.toUpperCase()}] ${config?.url}`);

            if (response) {
                console.error(`Status:  ${response.status} ${response.statusText}`);
                console.error('Data:   ', response.data);
                console.error('Headers:', response.headers);
            }
            else if (request) {
                console.error('📡 Нет ответа от сервера');
                console.error('Request:', request);
            }
        })
    }
    async getPortalData(token : string) : Promise<bitrixResponse<IAppInfo>>{
        const response = await this.AxiosClient.get(this.AuthURI + "app.info", {
            params: {
                auth : token
            }
        });
        return response.data as bitrixResponse<IAppInfo>;
    }
    async getAccesToken(client_id : string, client_secret : string, refresh_token : string){
        const response = await this.AxiosClient.get(`https://oauth.bitrix24.tech/oauth/token/`,{
        params: {
            grant_type : "refresh_token",
            client_id : client_id,
            client_secret : client_secret,
            refresh_token : refresh_token
            }
            
            
        });
        return response.data as IBitrixToken;
    }
    async getPortalToken(code : string, client_id : string, client_secret : string, url : string) : Promise<IBitrixToken>{
        const response = await this.AxiosClient.get(`https://${url}/oauth/token/`,{
        params: {
            grant_type : "authorization_code",
            client_id : client_id,
            client_secret : client_secret,
            code : code
            }
            
            
        });
        return response.data as IBitrixToken;
    }
    async enterHandler(domain : string, client_id : string){
        const response = await this.AxiosClient.get(`https://${domain}/oauth/authorize`,{
            params : {
                client_id : client_id
            }
        })
        return response.data as bitrixTokens;
    }
    async getCompanies(domain : string, token : string){
        const response = await this.AxiosClient.get(`https://${domain}/rest/crm.item.list`, {
            params : {
                entityTypeId : 4,
                auth : token
            }
        })
        return response.data as IResponseArrayNewBitrix<NewBitrixCompany>
    }
    async getCompany(id : number, token : string, domain : string){
        const response = await this.AxiosClient.get(`https://${domain}/rest/crm.company.get`, {
            params : {
                auth : token,
                ID : id
            }
        })
        return response.data as IResponseNewBitrix<NewBitrixCompany>
    }
    async getBitrixUsers(domain : string, token : string){
        const response = await this.AxiosClient.get(`https://${domain}/rest/user.get`,{
            params : {
                auth : token
            }
        })
        return response.data as bitrixResponse<IUser[]>;
    }
    async getBitrixUser(domain : string, token : string){
        const response = await this.AxiosClient.get(`https://${domain}/rest/user.current`,{
            params : {
                auth : token
            }
        })
        return response.data as bitrixResponse<IUser>;
    }
    async getItem<T>(domain : string, token : string, entityTypeId : string, id : string){
        const response = await this.AxiosClient.get(`https://${domain}/rest/crm.item.get`, {
            params : {
                entityTypeId : entityTypeId,
                id : id,
                auth : token,
            }
        })
        return response.data as IResponseNewBitrix<T>
    }
    async getItems<T>(domain : string, token : string, entityTypeId : string | number, filter? : object){
        const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.list`, {
            filter : filter,    
        }, {
            params: {
                entityTypeId : entityTypeId,
                auth : token,
            }
        })
        return response.data as IResponseArrayNewBitrix<T>
    }
    async getProductRowContract(domain : string, token : string, ownerId : string, ownerType : string){
        const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.productrow.list`,{
            filter : {
                "=ownerId" : ownerId,
                "=ownerType" : ownerType
            }
        },{
            params : {
                auth : token
            }
        })
        return response.data as bitrixResponse<{productRows : IProductRow[]}>
    }
    async getProductInfo(domain : string, token : string, id : number){
        const response = await this.AxiosClient.get(`https://${domain}/rest/catalog.product.get`,{
            params : {
                auth : token,
                id : id
            }
        })
        return response.data as bitrixResponse<{product : AnyProduct}>
    }
    async setProductRowContract(domain : string, token : string, contract_id : number, product_id : number, ownerType : string, price : number){
        const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.productrow.add`,{
            ownerId : contract_id,
            ownerType : ownerType,
            productId : product_id,
            price : price
        } , {
            params : {
                auth : token
            }
        })
        return response.data as bitrixResponse<{productRow : IProductRow}>
    }
    async updateCatalogProduct<T extends IProductCatalogCreate>(domain : string, token : string, product_id : number, ownerType : string,  data : T){
        const repsonse = await this.AxiosClient.post(`https://${domain}/rest/catalog.product.update`, {
            id : product_id,
            ownerType : ownerType,
            fields : data
        }, {
            params : {
                auth : token
            }
        })
        return repsonse.data as bitrixResponse<{product : AnyProduct}>
    }
    async updateProductRowContract(domain : string, token : string, product_id : number, body : object){
        const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.productrow.update`,{
            id : product_id,
            ...body
        } , {
            params : {
                auth : token
            }
        })
        return response.data as bitrixResponse<{productRow : IProductRow}>
    }
    async deleteProductRow(domain: string, token: string, product_id: number) {
        const response = await this.AxiosClient.post(`https://${domain}/rest/crm.item.productrow.delete`, {
            id: product_id
        }, {
            params: { auth: token }
        })
        return response.data as bitrixResponse<boolean>
    }
    async addCatalogProduct<T extends IProductCatalogCreate>(domain: string, token: string, parentId: number, body: T) {
        const response = await this.AxiosClient.post(`https://${domain}/rest/catalog.product.offer.add`, {
            fields: {
                iblockId : 16,
                parentId : parentId,
                ...body
            }
        }, {
            params: { auth: token }
        })
        return response.data as bitrixResponse<{ offer: AnyProduct }>
    }
    
}

export default new bitrixAPI();
