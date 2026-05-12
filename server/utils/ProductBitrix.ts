import companyClient from "../services/bitrix/CompanyClient";
import { IProductCatalogCreate, IProductRowDataCreate } from "../services/models";
import { CONTRACT_STRING_ID_BITRIX, getShapshotProduct, saveShapshotProduct } from "../services/webHooksEvents";

type ProductRowUpdateBody = Partial<IProductRowDataCreate>;

const DELETE_VERIFY_DELAY_MS = 300;
const DELETE_MAX_RETRIES = 3;

/**
 * Удаляет productRow и проверяет что B24 действительно его удалил.
 *
 * Известная проблема B24: при быстрых последовательных операциях над productRow
 * (например update + delete) внутренний индекс отстаёт, и delete возвращает
 * 200 OK, но строка остаётся. Здесь мы после delete делаем GET и, если строка
 * всё ещё видна, повторяем delete до DELETE_MAX_RETRIES раз.
 */
async function deleteProductRowVerified(company: companyClient, row_id: number): Promise<boolean> {
    for (let attempt = 1; attempt <= DELETE_MAX_RETRIES; attempt++) {
        try {
            await company.deleteProductRow(row_id);
        } catch (e) {
            console.warn(`[deleteRow ${row_id}] delete throw on attempt ${attempt}:`, e);
        }
        await new Promise(r => setTimeout(r, DELETE_VERIFY_DELAY_MS));
        let stillExists = false;
        try {
            const check = await company.getProductRowById(row_id);
            stillExists = !!check?.result?.productRow;
        } catch {
            // Ошибка на GET = строки нет (B24 вернул 4xx) → считаем удалённой.
            stillExists = false;
        }
        if (!stillExists) return true;
        if (attempt < DELETE_MAX_RETRIES) {
            console.warn(`[deleteRow ${row_id}] B24 проигнорировал delete, повтор ${attempt + 1}/${DELETE_MAX_RETRIES}`);
        }
    }
    console.error(`[deleteRow ${row_id}] B24 не удалил строку за ${DELETE_MAX_RETRIES} попыток`);
    return false;
}

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
        rowBody? : {row_id : number, body? : ProductRowUpdateBody},
        catalogBody? : {product_id : number, body? : Partial<T>}
    }){
        if(data){
            const {rowBody, catalogBody} = data;
            if(rowBody && rowBody.body) await company.updateProductRow(rowBody.row_id, rowBody.body)
            if(catalogBody && catalogBody.body) await company.updateCatalogProduct(catalogBody.product_id, catalogBody.body)
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
    await deleteProductRowVerified(company, row_id);
    const newProductRow = await company.addProductRow(newContractId, productId, ownerType, rest);
    getShapshotProduct(ownerId, portal_id)
    .then(s => {
        const del = s.findIndex(ss => ss.bitrix_id === row_id)
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
    await deleteProductRowVerified(company, row_id);
    try {
        await company.deleteProductOffer(product_id);
    } catch (e) {
        console.warn(`[deleteProductsOffer] not exist`, e);
    }
}

export async function switchProductCategory<T extends IProductCatalogCreate>(
    company : companyClient,
    portal_id : number,
    sourceContractId : number,
    targetContractId : number,
    old_row_id : number,
    old_product_id : number,
    catalogBody : {parent_id : number, data : T},
    rowBody : IProductRowDataCreate,
    newType : string
){
    await deleteProductRowVerified(company, old_row_id);
    try {
        await company.deleteProductOffer(old_product_id);
    } catch (e) {
        console.warn(`[switchProductCategory] не удалось удалить старый offer ${old_product_id}:`, e);
    }

    const productCatalog = await company.addCatalogProduct(catalogBody.parent_id, catalogBody.data);
    const productRow = await company.addProductRow(targetContractId, productCatalog.result.offer.id, CONTRACT_STRING_ID_BITRIX, rowBody);

    if(sourceContractId === targetContractId){
        const snap = await getShapshotProduct(sourceContractId, portal_id);
        const filtered = snap.filter(s => s.bitrix_id !== old_row_id);
        await saveShapshotProduct(sourceContractId, portal_id, [
            ...filtered,
            {bitrix_id : productRow.result.productRow.id, portal_id : portal_id, type : newType}
        ]);
    } else {
        const sourceSnap = await getShapshotProduct(sourceContractId, portal_id);
        await saveShapshotProduct(sourceContractId, portal_id, sourceSnap.filter(s => s.bitrix_id !== old_row_id));
        const targetSnap = await getShapshotProduct(targetContractId, portal_id);
        await saveShapshotProduct(targetContractId, portal_id, [
            ...targetSnap,
            {bitrix_id : productRow.result.productRow.id, portal_id : portal_id, type : newType}
        ]);
    }

    return {productRow, productCatalog};
}