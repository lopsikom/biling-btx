import bitrixAPI from "../services/bitrix/bitrixAPI";
import companyClient from "../services/bitrix/CompanyClient";
import { IProductCatalogCreate } from "../services/models";
import { CONTRACT_STRING_ID_BITRIX } from "../services/webHooksEvents";

export default async function setProductBitrix<T extends IProductCatalogCreate>(
    company : companyClient,
    rowBody : {contract_id : number, price : number}, 
    catalogBody : {parent_id : number, data : T}){
    const productCatalog = await company.addCatalogProduct(
        catalogBody.parent_id, 
        catalogBody.data)
    const productRow = await company.addProductRow(
         rowBody.contract_id, 
         productCatalog.result.offer.id, 
         CONTRACT_STRING_ID_BITRIX, rowBody.price)
    return {productRow, productCatalog}
}