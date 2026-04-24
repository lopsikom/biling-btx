import bitrixAPI from "../services/bitrix/bitrixAPI";
import companyClient from "../services/bitrix/CompanyClient";
import { IProductCatalogCreate, IProductRowDataCreate } from "../services/models";
import { CONTRACT_STRING_ID_BITRIX, getShapshotProduct, saveShapshotProduct } from "../services/webHooksEvents";
import { acquireLock, releaseLock } from "./redis/webHookLocker";

export async function setProductBitrix<T extends IProductCatalogCreate>(
    company : companyClient,
    rowBody : {contract_id : number, data : IProductRowDataCreate}, 
    catalogBody : {parent_id : number, data : T}){
    const productCatalog = await company.addCatalogProduct(
        catalogBody.parent_id, 
        catalogBody.data)
    const productRow = await company.addProductRow(
         rowBody.contract_id, 
         productCatalog.result.offer.id, 
         CONTRACT_STRING_ID_BITRIX, rowBody.data)
    return {productRow, productCatalog}
}

export async function updateProductBitrix<T extends IProductCatalogCreate>(
    company : companyClient,
    data? : {
        rowBody? : {row_id : number, body? : Partial<IProductCatalogCreate>},
        catalogBody? : {product_id : number, body? : Partial<T>}
    }){
        console.log(data)
        if(data){
            const {rowBody, catalogBody} = data;
            console.log(rowBody, catalogBody)
            if(rowBody && rowBody.body) company.updateProductRow(rowBody.row_id, rowBody.body)
            if(catalogBody && catalogBody.body) company.updateCatalogProduct(catalogBody.product_id, catalogBody.body)
        }
    }

export async function switchContractProduct(
    company : companyClient,
    portal_id : number,
    newContractId : number,
    row_id : number,
    type : string
){
    const productRow = await company.getProductRowById(row_id);
    if(!productRow) return
    const {id, ownerId, ownerType, productId, ...rest} = productRow.result.productRow;
    await company.deleteProductRow(row_id);
    const newProductRow = await company.addProductRow(newContractId, productId, ownerType, rest);
    getShapshotProduct(ownerId, portal_id)
    .then(s => {
        const del = s.findIndex(ss => ss.bitrix_id === newProductRow.result.productRow.id)
        if(del > -1) {
            s.splice(del, 1)
            return saveShapshotProduct(ownerId, portal_id, s)
        }
    })
    getShapshotProduct(newContractId, portal_id)
    .then(s => {
        return saveShapshotProduct(newContractId, portal_id, [...s, 
            {bitrix_id : newProductRow.result.productRow.id, portal_id : portal_id, type : type}
        ])
    })
    return newProductRow
}

export async function deleteProducts(company : companyClient, row_id : number, product_id : number){
    await company.deleteProductRow(row_id);
    await company.deleteProductOffer(product_id);
}