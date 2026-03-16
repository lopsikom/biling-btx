import axios from "axios";
import type { B24Frame } from '@bitrix24/b24jssdk'
import type { IAutoinformation, IAutoinformationFilterUpdate, IAutoinformationPost, IChatBot, IChatBotFilter, IChatBotPost, IChatBotUpdate, IConnection, IConnectionPatch, IConnectionPost, IConnectionStatus, IConnectionType, IContract, IContractFilter, IContractPost, IContractStatus, IContractUpdate, IEvent, IEventFilter, IMessengers, Integrations, ITarrifs, IVats, IVatsFilter, IVatsPost, IVatsUpdate, IVoiceRobot, IVoiceRobotFilter, IVoiceRobotPost, IVoiceRobotUpdate, IWebform, IWebFormFilterUpdate, IWebformPost } from "~~/shared/models/APIModels";


export class axiosClient{
    private AxiosClient;
    private BitrixFrame : B24Frame | undefined;
    constructor(){
        const url = useRuntimeConfig().public.BaseUri + useRuntimeConfig().public.BaseUrl + "api/";
        this.AxiosClient = axios.create({baseURL : url, headers: {
            'Content-Type': 'application/json'
        }});
        this.AxiosClient.interceptors.request.use(async (config) => {
            console.log(config.baseURL, config.url)
            console.log(config.params)
            if(!config.headers.Authorization){
                if(this.BitrixFrame){
                    const auth = this.BitrixFrame.auth.getAuthData();
                    if(auth) config.headers.Authorization = auth.access_token;
                }
            }
            return config
        })
        this.AxiosClient.interceptors.response.use(async (response) => {
            if(useNuxtApp().$config.public.dev) console.log(response.data)
            return response
        })
    }

    set setBitrixFrame(BitrixFrame : B24Frame) {this.BitrixFrame = BitrixFrame;}

    async verifyBitrixUser(token : string) {
        const response = await this.AxiosClient.get<boolean>("oauth/verify.install",{
            headers:{
                Authorization : token
            }
        })
        return response.data
    }
    async getCheckCompany(){
        const response = await this.AxiosClient.get<boolean>(`bitrix/company.check/${this.BitrixFrame?.placement.options.ID ?? "2"}`)
        return response.data 
    }
    async getContractStatuses(){
        const response = await this.AxiosClient.get("modules/contract.statuses.list")
        return response.data as IContractStatus[]
    }
    async getMessengers(){
        const response = await this.AxiosClient.get("modules/messengers.list")
        return response.data as IMessengers[]
    }
    async getIntegrations(){
        const response = await this.AxiosClient.get("modules/integrations.list")
        return response.data as Integrations[]
    }

    async getTariff(){
        const response = await this.AxiosClient.get("modules/tariff.list")
        return response.data as ITarrifs[]
    }

    async getContracts(filter? : IContractFilter) {
        const response = await this.AxiosClient.get("modules/contract.list", {
            params : {
                filter : JSON.stringify(filter)
            }
        })
        return response.data as IContract[]
    }
    async getContractById(id : number){
        const response = await  this.AxiosClient.get(`modules/contract/${id}`)
        return response.data as IContract
    }
    
    async deleteContract(id : number){
        const response = await  this.AxiosClient.delete(`modules/contract/${id}`)
        return response.data as boolean
    }
    async postContract(data : IContractPost) {
        if(!data.company_id) {
            if(useNuxtApp().$config.public.dev) data.bitrix_id = this.BitrixFrame?.placement.options.ID ?? "2"
            else data.bitrix_id = this.BitrixFrame?.placement.options.ID
        }
        const response = await this.AxiosClient.post('modules/contract.add', data)
        return response.data as IContract
    }
    async patchContract(data : IContractUpdate, id : number) {
        const response = await this.AxiosClient.patch(`modules/contract/${id}`, data)
        return response.data as IContract
    }
    async getVats(filter? : IVatsFilter) {
        const response = await this.AxiosClient.get("modules/vats.list", {
            params : {
                filter : JSON.stringify(filter)
            }
        })
        return response.data as IVats[]
    }
    async getVatsById(id : number){
        const response = await this.AxiosClient.get(`modules/vats/${id}`)
        return response.data as IVats
    }
    async postVats(data : IVatsPost) {
        const response = await this.AxiosClient.post("modules/vats.add", data)
        return response.data as IVats;
    }
    async patchVats(id : number, data : IVatsUpdate) {
        const response = await this.AxiosClient.patch(`modules/vats/${id}`, data)
        return response.data as IVats;
    }
    
    async deleteVats(id : number){
        const response = await this.AxiosClient.delete(`modules/vats/${id}`)
        return response.data as boolean
    }

    async getVoiceRobots(filter? : IVoiceRobotFilter) {
        const response = await this.AxiosClient.get("modules/voice_robot.list", {
            params : {
                filter : JSON.stringify(filter)
            }
        })
        return response.data as IVoiceRobot[]
    }
    async getVoiceRobotsbyId(id : number){
        const response = await this.AxiosClient.get(`modules/voice_robot/${id}`)
        return response.data as IVoiceRobot
    }
    async postVoiceRobot(data : IVoiceRobotPost) {
        const response = await this.AxiosClient.post("modules/voice_robot.add", data)
        return response.data as IVoiceRobot;
    }
    async patcVoiceRobot(id : number, data : IVoiceRobotUpdate) {
        const response = await this.AxiosClient.patch(`modules/voice_robot/${id}`, data)
        return response.data as IVoiceRobot;
    }
    async deleteVoiceRobot(id : number){
        const response = await this.AxiosClient.delete(`modules/voice_robot/${id}`)
        return response.data as boolean
    }
    async getChatBots(filter? : IChatBotFilter) {
        const response = await this.AxiosClient.get("modules/chat_bot.list", {
            params : {
                filter : JSON.stringify(filter)
            }
        })
        return response.data as IChatBot[]
    }
    async getChatBotById(id : number){
        const response = await this.AxiosClient.get(`modules/chat_bot/${id}`)
        return response.data as IChatBot
    }
     async postChatBots(data : IChatBotPost) {
        const response = await this.AxiosClient.post("modules/chat_bot.add", data)
        return response.data as IChatBot;
    }
    async patcChatBots(id : number, data : IChatBotUpdate) {
        const response = await this.AxiosClient.patch(`modules/chat_bot/${id}`, data)
        return response.data as IChatBot;
    }
    async deleteChatBot(id : number){
        const response = await this.AxiosClient.delete(`modules/chat_bot/${id}`)
        return response.data as boolean
    }
    async getAutoInfos(filter? : IAutoinformationFilterUpdate) {
        const response = await this.AxiosClient.get("modules/autoinformation.list", {
            params : {
                filter : JSON.stringify(filter)
            }
        })
        return response.data as IAutoinformation[]
    }
    async getAutoInfoById(id : number){
        const response = await this.AxiosClient.get(`modules/autoinformation/${id}`)
        return response.data as IAutoinformation
    }
    async postAutoInfo(data : IAutoinformationPost) {
        const response = await this.AxiosClient.post("modules/autoinformation.add", data)
        return response.data as IAutoinformation;
    }
    async patcAutoInfo(id : number, data : IAutoinformationFilterUpdate) {
        const response = await this.AxiosClient.patch(`modules/autoinformation/${id}`, data)
        return response.data as IAutoinformation;
    }
    async deleteAutoInfo(id : number){
        const response = await this.AxiosClient.delete(`modules/autoinformation/${id}`)
        return response.data as boolean
    }
    async getWebforms(filter? : IWebFormFilterUpdate) {
        const response = await this.AxiosClient.get("modules/webform.list", {
            params : {
                filter : JSON.stringify(filter)
            }
        })
        return response.data as IWebform[]
    }
    async getWebformById(id : IWebform) {
        const response = await this.AxiosClient.get(`modules/webform/${id}`)
        return response.data as IWebform
    }
    async postWebform(data : IWebformPost) {
        const response = await this.AxiosClient.post("modules/webform.add", data)
        return response.data as IWebform;
    }
    async patcWebform(id : number, data : IWebFormFilterUpdate) {
        const response = await this.AxiosClient.patch(`modules/webform/${id}`, data)
        return response.data as IWebform;
    }
    async deleteWebform(id : number) {
        const response = await this.AxiosClient.delete(`modules/webform/${id}`)
        return response.data as boolean;
    }

    async getConnectionStatus(){
        const response = await this.AxiosClient.get(`connection.status`);
        return response.data as IConnectionStatus[]
    }
    async getConnectionType(){
        const response = await this.AxiosClient.get(`connection.type`);
        return response.data as IConnectionType[];
    }
    async getConnectionList(data? : IConnectionPatch){
        const response = await this.AxiosClient.get(`connection.list`,{
            params : {
                filter : JSON.stringify(data)
            }
        })
        return response.data as IConnection[]
    }
    async postConnection(data : IConnectionPost){
        if(!data.company_id) {
            if(useNuxtApp().$config.public.dev) data.company_id = this.BitrixFrame?.placement.options.ID ?? "2"
            else data.company_id = this.BitrixFrame?.placement.options.ID
        }
        const response = await this.AxiosClient.post(`connection.add`, data)
        return response.data as IConnection
    }
    async  patchConnection(data : IConnectionPatch,id : number){
        const response = await this.AxiosClient.patch(`connection/${id}`, data)
        return response.data as IConnection
    }
    async deleteConnection(id : number){
        const response = await this.AxiosClient.delete(`connection/${id}`);
        return response.data as boolean
    }
    async getEvents(data : { filter : IEventFilter}) : Promise<IEvent[]>
    async getEvents(data : { filter? : IEventFilter, pagination : {skip : number, limit : number}}) :  Promise<{ data: IEvent[], count: number}>
    async getEvents(data : { filter? : IEventFilter, pagination? : {skip : number, limit : number}}){
        const params : any = {}
        const filter = {...data.filter, companyId : this.BitrixFrame?.placement.options.ID ?? 
            (useNuxtApp().$config.public.dev ? "2" : "0")} as IEventFilter
        params.filter = JSON.stringify(filter)
        if(data.pagination) {
            params.skip = data.pagination.skip,
            params.limit = data.pagination.limit
        }
        const response = await this.AxiosClient.get(`event.list`,{
            params : {
                ...params,
            }
        })
        if(data.pagination) return response.data as { data: IEvent[], count: number}
        else return response.data as IEvent[]
    }
    

}