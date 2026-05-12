import { ZodError } from "zod";
import * as z from "zod"
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { autoinformationInputMapPrisma } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getContractById } from "~~/server/utils/prisma/modules/Contract";
import { getAutoinformationByIdPrisma, patchAutoinfromationPrisma, requireAutoInfo } from "~~/server/utils/prisma/modules/AutoInfo";
import { switchContractProduct, switchProductCategory, updateProductBitrix } from "~~/server/utils/ProductBitrix";
import { autoinformationProductTypeByTypeId, autoinformationPropsForCatalog } from "~~/server/utils/bitrixProductProps";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";
import { AutoInformationFilterUpdate, entityType } from "~~/shared/models/APIModels";
import { IProductCatalogCreate, productRecords } from "~~/shared/models/bitrixModels";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType;
    const body = await readBody(event);
    if (id) {
        try {
            const parseId = z.coerce.number().parse(id)
            const verify = await requireAutoInfo(parseId, portal.portal.id)
            if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
            const ZData = await AutoInformationFilterUpdate.parseAsync(body)
            const prismaData = autoinformationInputMapPrisma(ZData)
            const OldAutoinformation = await getAutoinformationByIdPrisma(parseId);
            if (!OldAutoinformation || !OldAutoinformation.bitrix_id || !OldAutoinformation.contract_id) throw createError({ statusCode: 404, statusMessage: "No found autoinformation" })
            const contract = await getContractById(OldAutoinformation.contract_id);
            if (!contract || !contract.bitrix_id) throw createError({ statusCode: 404, statusMessage: "No found contract" })

            const oldType = OldAutoinformation.type_id ?? 1
            const newType = ZData.type_id ?? oldType
            const oldCategory = autoinformationProductTypeByTypeId(oldType)
            const newCategory = autoinformationProductTypeByTypeId(newType)
            const isCategoryMigration = oldCategory !== newCategory

            await acquireLock(contract.bitrix_id, portal.portal.id)
            try {
                const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)

                if (isCategoryMigration) {
                    let targetContractBitrixId = contract.bitrix_id
                    let needSecondLock = false
                    if (ZData.contract_id && ZData.contract_id !== OldAutoinformation.contract_id) {
                        const newContract = await getContractById(ZData.contract_id)
                        if (newContract && newContract.bitrix_id) {
                            targetContractBitrixId = newContract.bitrix_id
                            needSecondLock = true
                            await acquireLock(newContract.bitrix_id, portal.portal.id)
                        }
                    }
                    try {
                        const finalActive = ZData.active !== undefined ? (ZData.active ? "Y" : "N") : (OldAutoinformation.active ? "Y" : "N")
                        const finalTitle = ZData.title ?? OldAutoinformation.title
                        const finalPrice = ZData.price ?? OldAutoinformation.price
                        const newCatalogProps = autoinformationPropsForCatalog(newType) ?? {}
                        const result = await switchProductCategory<IProductCatalogCreate>(
                            company,
                            portal.portal.id,
                            contract.bitrix_id,
                            targetContractBitrixId,
                            OldAutoinformation.bitrix_id,
                            OldAutoinformation.product_id!,
                            { parent_id: productRecords[newCategory].id, data: { name: newCategory, active: finalActive, ...newCatalogProps } as unknown as IProductCatalogCreate },
                            { productName: finalTitle, price: finalPrice },
                            newCategory
                        )
                        prismaData.bitrix_id = result.productRow.result.productRow.id
                        prismaData.product_id = result.productCatalog.result.offer.id
                        if (ZData.contract_id) prismaData.contract = { connect: { id: ZData.contract_id } }
                    } finally {
                        if (needSecondLock) {
                            await releaseLock(targetContractBitrixId, portal.portal.id)
                        }
                    }
                } else {
                    const catalogProps = autoinformationPropsForCatalog(ZData.type_id)
                    await updateProductBitrix<IProductCatalogCreate>(company, {
                        rowBody: { row_id: OldAutoinformation.bitrix_id, body: { productName: ZData.title, price: ZData.price } },
                        catalogBody: catalogProps && OldAutoinformation.product_id ? { product_id: OldAutoinformation.product_id, body: catalogProps as unknown as Partial<IProductCatalogCreate> } : undefined
                    })
                    if (ZData.contract_id) {
                        const newContract = await getContractById(ZData.contract_id);
                        if (newContract && newContract.bitrix_id) {
                            await acquireLock(newContract.bitrix_id, portal.portal.id);
                            try {
                                const newRow = await switchContractProduct(company, portal.portal.id, newContract.bitrix_id, OldAutoinformation.bitrix_id, oldCategory)
                                if (newRow) {
                                    prismaData.bitrix_id = newRow.result.productRow.id
                                }
                                else {
                                    delete prismaData.contract
                                }
                            }
                            finally {
                                await releaseLock(newContract.bitrix_id, portal.portal.id);
                            }
                        }
                    }
                }

                const autoinformation = await patchAutoinfromationPrisma(parseId, prismaData);
                if (!autoinformation) {
                    throw createError({
                        statusCode: 404,
                        statusMessage: "no found autoinformation"
                    })
                }
                eventsAudit.emit("entity.update", {
                    userid: portal?.user_id,
                    entity: entityType.AUTOINFORMATION,
                    entityName: autoinformation.title,
                    companyid: autoinformation.contract?.company_id
                } as EventEntity)
                return autoinformation
            } finally {
                await releaseLock(contract.bitrix_id, portal.portal.id)
            }
        } catch (e) {
            console.error(e);
            if (e instanceof ZodError) {
                console.error(e.issues);
                const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
                throw createError({
                    statusCode: 400,
                    statusMessage: "Vallidation Error",
                    message: mess
                })
            }
            else {
                throw createError({
                    statusCode: 500,
                    statusMessage: "Server Error"
                })
            }
        }
    }
    else {
        throw createError({
            statusCode: 404,
            statusMessage: "none id"
        })
    }
})
