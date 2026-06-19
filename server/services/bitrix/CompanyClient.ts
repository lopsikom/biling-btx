import axios, { AxiosInstance } from "axios";
import bitrixAPI, { bitrixResponse } from "./bitrixAPI";
import { AnyProduct, IAddress, IBitrixToken, ICompnany, IContact, IContractBitrix, Invoice, IProductCatalogCreate, IProductRow, IProductRowDataCreate, IRequisite, IResponseArrayNewBitrix, IResponseNewBitrix } from "../models";
import { portalPrisma } from "~~/server/utils/prisma/getPortal";
import { redisClient } from "../redis";
import { b24RateLimiter } from "~~/server/utils/rateLimiter";
import { ICacheCompany } from "~~/shared/models/APIModels";
import { contractInputMapPrisma } from "~~/server/utils/mappers";
import { addContractPrisma } from "~~/server/utils/prisma/modules/Contract";
import { reconcileContractProducts } from "../contractProductSync/reconcileContractProducts";

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
            await b24RateLimiter.acquire(this.domain);
            if (!config.params) {
                config.params = {};
            }
            if(!config.params.auth) {
                const parseToken = await redisClient.get(`token:${this.portal_id}`);
                if(parseToken) {
                    const token = JSON.parse(parseToken) as IBitrixToken;
                    config.params.auth = token.access_token;
                    return config;
                }
                const portal = await getPortal({id : this.portal_id})
                if(!portal || !portal.refresh_token) return config;
                const token = await bitrixAPI.getAccesToken(portal.client_id, portal.client_secret, portal.refresh_token);
                if(!token) return config
                redisClient.set(`token:${this.portal_id}`, JSON.stringify(token), "EX", 3000);
                config.params.auth = token.access_token;
                return config
            }
            return config
        })
        this.axiosClient.interceptors.response.use((response) => response,(error) => {
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
    async addContract(data : IContractBitrix){
        const entityTypeId = useRuntimeConfig().ContractIdBitrix;
        const response = await this.axiosClient.post(`/rest/crm.item.add`,{}, {
            params : {
                entityTypeId : entityTypeId,
                fields : data
            }
        })
        return response.data as IResponseNewBitrix<IContractBitrix>
    }
    async patchContract(data : Omit<Partial<IContractBitrix>, "id">, id : number){
        const entityTypeId = useRuntimeConfig().ContractIdBitrix;
        const response = await this.axiosClient.post('/rest/crm.item.update', {}, {
            params : {
                entityTypeId : entityTypeId,
                id : id,
                fields : data
            }
        })
        return response.data as IResponseNewBitrix<IContractBitrix>
    }
    async getProductRowContract(ownerId: string, ownerType: string) {
        const response = await this.axiosClient.post('/rest/crm.item.productrow.list', {
            filter: {
                "=ownerId": ownerId,
                "=ownerType": ownerType
            }
        })
        return response.data as bitrixResponse<{ productRows: IProductRow[] }>
    }
    async getProductRowById(id : number){
        const response = await this.axiosClient.post('/rest/crm.item.productrow.get', {id : id})
        return response.data as bitrixResponse<{productRow : IProductRow}>
    }

    async getProductInfo(id: number) {
        const response = await this.axiosClient.get('/rest/catalog.product.get', {
            params: { id }
        })
        return response.data as bitrixResponse<{ product: AnyProduct }>
    }

    async addProductRow(contract_id: number, product_id: number, ownerType: string, body : IProductRowDataCreate) {
        console.log("add row", contract_id)
        const response = await this.axiosClient.post('/rest/crm.item.productrow.add', {
            fields: {
                ownerId:   contract_id,
                ownerType: ownerType,
                productId: product_id,
                ...body,
            }
        })
        return response.data as bitrixResponse<{ productRow: IProductRow }>
    }

    async updateProductRow(product_id: number, body: object) {
        const response = await this.axiosClient.post('/rest/crm.item.productrow.update', {
            id: product_id,
            fields : body
        })
        return response.data as bitrixResponse<{ productRow: IProductRow }>
    }

    async deleteProductRow(product_id: number) {
        const response = await this.axiosClient.get('/rest/crm.item.productrow.delete', {params : {id: product_id}})
        console.log("response delete", response)
        return response.data as bitrixResponse<boolean>
    }
    async deleteProductOffer(product_id: number){
        const response = await this.axiosClient.post(`/rest/catalog.product.offer.delete`, {
            id : product_id
        })
        return response.data
    }

    async updateCatalogProduct<T extends IProductCatalogCreate>(product_id: number, data: Partial<T>) {
        const response = await this.axiosClient.post('/rest/catalog.product.offer.update', {
            id:     product_id,
            fields: data
        })
        return response.data as bitrixResponse<{ product: AnyProduct }>
    }

    async addCatalogProduct<T extends IProductCatalogCreate>(parentId: number, body: T) {
        const response = await this.axiosClient.post('/rest/catalog.product.offer.add', {
            fields: {
                iblockId: 16,
                parentId: parentId,
                ...body
            }
        })
        return response.data as bitrixResponse<{ offer: AnyProduct }>
    }

    async setCatalogPrice(productId: number, price: number, currency = "RUB", catalogGroupId = 1) {
        const response = await this.axiosClient.post('/rest/catalog.price.add', {
            fields: {
                productId:      productId,
                catalogGroupId: catalogGroupId,
                price:          price,
                currency:       currency,
            }
        })
        return response.data as bitrixResponse<{ price: { id: number } }>
    }

}

export async function initCompanyClient(bitrix_id : number, portal : number){
    let portalPrisma : portalPrisma
    portalPrisma = await getPortal({id : portal})
    if(!portalPrisma || !portalPrisma.refresh_token) return
    const token = await bitrixAPI.getAccesToken(portalPrisma.client_id, portalPrisma.client_secret, portalPrisma.refresh_token);
    const company = await bitrixAPI.getCompany(bitrix_id, token.access_token, portalPrisma.domain);
    console.log(company);
    const companyPrsima = await postCompany(portalPrisma.id, ...companyMapUpsertPrisma(portalPrisma.id, [], company.result.item));

    await syncCompanyContractsAndProducts(portalPrisma.domain, token.access_token, portalPrisma.id, bitrix_id);

    return new companyClient(portalPrisma.domain, companyPrsima[0].id, bitrix_id.toString())
}

/**
 * Подтягивает в БД все договоры указанной компании вместе с их
 * товарами-модулями. Вызывается при первом открытии виджета в карточке компании,
 * когда компания только добавлена в БД и нужно синхронизировать связанные сущности.
 * Логика повторяет обработчик CRM_DYNAMIC_ITEM_ADD, но идёт от компании, а не от
 * одного договора: перебирает все её договоры.
 */
async function syncCompanyContractsAndProducts(domain : string, token : string, portal_id : number, companyBitrixId : number){
    const config = useRuntimeConfig();
    const CONTRACT_ID_BITRIX = config.ContractIdBitrix;
    const CONTRACT_STRING_ID_BITRIX = config.ContractStringIdBitrix;

    const contracts = (await bitrixAPI.getItems<IContractBitrix>(domain, token, CONTRACT_ID_BITRIX, {
        companyId : companyBitrixId
    })).result.items;
    if(!contracts.length) return;
    let myCompanys : ICacheCompany[] = [];
    try{
        const cache = await redisClient.get(`myCompanyBitrix:${portal_id}`);
        if(cache) myCompanys = JSON.parse(cache) as ICacheCompany[];
        else{
            myCompanys = (await bitrixAPI.getItems<{id : number, title : string}>(domain, token, 4, {isMyCompany : "Y"}))
                .result.items.map(c => ({id : c.id, title : c.title} as ICacheCompany));
            await redisClient.set(`myCompanyBitrix:${portal_id}`, JSON.stringify(myCompanys));
        }
    }catch(e){
        console.error("[syncCompany] не удалось получить myCompany", e);
    }

    await Promise.all(contracts.map(async contract => {
        try{
            if(!contract.id || !contract.companyId) return;

            const myCompany = myCompanys.find(c => c.id === contract.mycompanyId);

            await addContractPrisma(contractInputMapPrisma(contract, portal_id, myCompany));

            // Backfill товаров договора: без userId → аудит молчит (см. CONTEXT.md → events).
            await reconcileContractProducts({
                domain,
                token,
                contractBitrixId: contract.id,
                contractStringId: CONTRACT_STRING_ID_BITRIX,
                portalId: portal_id,
                mode: 'create'
            });
        }catch(e){
            console.error(`[syncCompany] ошибка обработки договора ${contract.id}`, e);
        }
    }));

    console.log(`[syncCompany] синхронизировано договоров: ${contracts.length}`);
}