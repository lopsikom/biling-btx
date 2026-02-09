import axios from "axios";

export class axiosClient{
    private AxiosClient;
    constructor(){
        const url = useRuntimeConfig().public.BaseUri + useRuntimeConfig().public.BaseUrl + "api/";
        this.AxiosClient = axios.create({baseURL : url, headers: {
            'Content-Type': 'application/json'
        }});
    }

    async verifyBitrixUser(token : string) {
        const response = await this.AxiosClient.get("oauth/verify.install",{
            headers:{
                Authorization : token
            }
        })
        return response.data as boolean;
    }
}