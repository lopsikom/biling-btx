import axios, {AxiosInstance} from "axios"
import { IAppInfo, IBitrixToken } from "./models"

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
        const response = await this.AxiosClient.get(`https://${domain}/oauth/authorize/`,{
            params : {
                client_id : client_id
            }
        })
        return response.data;
    }
}

export default new bitrixAPI();
