import bitrixAPI from "../services/bitrix/bitrixAPI";
import { IProductCatalogCreate } from "../services/models";
import { CONTRACT_STRING_ID_BITRIX } from "../services/webHooksEvents";

export default async function setProductBitrix<T extends IProductCatalogCreate>(
    domain : string, 
    token : string, 
    rowBody : {contract_id : number, price : number}, 
    catalogBody : {parent_id : number, data : T}){
    const productCatalog = await bitrixAPI.addCatalogProduct(
        domain, 
        token, 
        catalogBody.parent_id, 
        catalogBody.data)
    const productRow = await bitrixAPI.setProductRowContract(
         domain,
         token,
         rowBody.contract_id, 
         productCatalog.result.offer.id, 
         CONTRACT_STRING_ID_BITRIX, rowBody.price)
    return {productRow, productCatalog}
}