import { ZodError } from "zod";
import * as z from "zod"
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { webformGetMapPrisma, webformInputUpdateMapPrisma } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getContractById } from "~~/server/utils/prisma/modules/Contract";
import { getWebformByIdPrisma, patchWebformPrisma } from "~~/server/utils/prisma/modules/WebForm";
import { switchContractProduct, updateProductBitrix } from "~~/server/utils/ProductBitrix";
import { webformPropsForCatalog } from "~~/server/utils/bitrixProductProps";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";
import { entityType, WebFormFilterUpdate } from "~~/shared/models/APIModels";
import { IProductCatalogCreate, ProductEnum } from "~~/shared/models/bitrixModels";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType;
    const body = await readBody(event);
    if (id) {
        try {
            const parseId = z.coerce.number().parse(id)
            const ZData = await WebFormFilterUpdate.parseAsync(body)
            const prismaData = webformInputUpdateMapPrisma(ZData)
            const OldWebform = await getWebformByIdPrisma(parseId);
            if (!OldWebform || !OldWebform.bitrix_id || !OldWebform.contract_id) throw createError({ statusCode: 404, statusMessage: "No found webform" })
            const contract = await getContractById(OldWebform.contract_id);
            if (!contract || !contract.bitrix_id) throw createError({ statusCode: 404, statusMessage: "No found contract" })
            await acquireLock(contract.bitrix_id, portal.portal.id)
            try {
                const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
                const catalogProps = webformPropsForCatalog({ tarrif_id: ZData.tarrif_id })
                await updateProductBitrix<IProductCatalogCreate>(company, {
                    rowBody: { row_id: OldWebform.bitrix_id, body: { productName: ZData.title, price: ZData.price } },
                    catalogBody: catalogProps && OldWebform.product_id ? { product_id: OldWebform.product_id, body: catalogProps as unknown as Partial<IProductCatalogCreate> } : undefined
                })
                if (ZData.contract_id) {
                    const newContract = await getContractById(ZData.contract_id);
                    if (newContract && newContract.bitrix_id) {
                        await acquireLock(newContract.bitrix_id, portal.portal.id);
                        try {
                            const newRow = await switchContractProduct(company, portal.portal.id, ZData.contract_id, OldWebform.bitrix_id, ProductEnum.WEB_FORM)
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
                const webform = await patchWebformPrisma(parseId, prismaData, ZData.integrations)
                if (!webform) {
                    throw createError({
                        statusCode: 404,
                        statusMessage: "no found webform"
                    })
                }
                eventsAudit.emit("entity.update", {
                    userid: portal?.user_id,
                    entity: entityType.WEBFORM,
                    entityName: webform.title,
                    companyid: webform.contract?.company_id
                } as EventEntity)
                return webformGetMapPrisma(webform)
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
