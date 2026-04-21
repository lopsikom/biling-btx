import axios, {AxiosInstance} from "axios"
import { AnyProduct, IAppInfo, IBitrixToken, ICatalogProduct, ICompnany, IContractBitrix, IProductRow, IResponseArrayNewBitrix, IResponseNewBitrix, IUser, NewBitrixCompany } from "../models"
import { bitrixTokens } from "~~/server/utils/getBitrixToken"
import { config } from "process"

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
        return response.data as IResponseArrayNewBitrix<NewBitrixCompany[]>
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
    async getItems<T>(domain : string, token : string, entityTypeId : string, filter? : object){
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
            "=ownerId" : ownerId,
            "=ownerType" : ownerType
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
}

export default new bitrixAPI();
