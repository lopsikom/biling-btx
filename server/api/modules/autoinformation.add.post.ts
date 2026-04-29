import { ZodError } from "zod";
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { getShapshotProduct, saveShapshotProduct } from "~~/server/services/webHooksEvents";
import { autoinformationInputMapPrisma } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getContractById } from "~~/server/utils/prisma/modules/Contract";
import { postAutoinformationPrisma } from "~~/server/utils/prisma/modules/AutoInfo";
import { setProductBitrix } from "~~/server/utils/ProductBitrix";
import { autoinformationProductTypeByTypeId, autoinformationPropsForCatalog } from "~~/server/utils/bitrixProductProps";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";
import { AutoInformationPost, entityType } from "~~/shared/models/APIModels";
import { IProductCatalogCreate, productRecords } from "~~/shared/models/bitrixModels";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const portal = event.context.portal as PortalDataType;
    try {
        const Zbody = await AutoInformationPost.parseAsync(body);
        const prismaBody = autoinformationInputMapPrisma(Zbody);
        const contract = await getContractById(Zbody.contract_id);
        if (!contract || !contract.bitrix_id) throw createError({ statusCode: 404, statusMessage: "No found contract" })

        await acquireLock(contract.bitrix_id, portal.portal.id)

        try {
            const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
            const productType = autoinformationProductTypeByTypeId(Zbody.type_id)
            const catalogProps = autoinformationPropsForCatalog(Zbody.type_id) ?? {}
            const product = await setProductBitrix<IProductCatalogCreate>(company,
                { contract_id: contract.bitrix_id, data: { price: Zbody.price, productName: Zbody.title } },
                { parent_id: productRecords[productType].id, data: { name: productType, active: Zbody.active ? "Y" : "N", ...catalogProps } as unknown as IProductCatalogCreate }
            )

            prismaBody.bitrix_id = product.productRow.result.productRow.id;
            prismaBody.product_id = product.productCatalog.result.offer.id;
            prismaBody.portal = { connect: { id: portal.portal.id } }
            const autoinformation = await postAutoinformationPrisma(prismaBody);
            const snapshot = await getShapshotProduct(contract.bitrix_id, portal.portal.id)
            await saveShapshotProduct(contract.bitrix_id, portal.portal.id, [
                ...snapshot,
                { bitrix_id: product.productRow.result.productRow.id, portal_id: portal.portal.id, type: productType }
            ])
            eventsAudit.emit("entity.create", {
                userid: portal?.user_id,
                entity: entityType.AUTOINFORMATION,
                entityName: autoinformation.title,
                companyid: autoinformation.contract?.company_id
            } as EventEntity)

            setResponseStatus(event, 201);
            return autoinformation

        } finally {
            await releaseLock(contract.bitrix_id, portal.portal.id)
        }

    } catch (e) {
        console.error(e);
        if (e instanceof ZodError) {
            const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
            throw createError({ statusCode: 400, statusMessage: "Vallidation Error", message: mess })
        }
        throw createError({ statusCode: 500, statusMessage: "Server Error" })
    }
})
