import * as z from "zod";
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { EventEntity, eventsAudit } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getContractById } from "~~/server/utils/prisma/modules/Contract";
import { deleteAutoInforPrisma, getAutoinformationByIdPrisma, requireAutoInfo } from "~~/server/utils/prisma/modules/AutoInfo";
import { deleteProducts } from "~~/server/utils/ProductBitrix";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";
import { entityType } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    if (id) {
        const parseId = z.coerce.number().parse(id)
        // const verify = await requireAutoInfo(parseId, portal.portal.id);
        // if(!verify) throw createError({statusCode : 404, statusMessage : "not verify portal"})
        const OldAutoinformation = await getAutoinformationByIdPrisma(parseId);
        if (!OldAutoinformation) throw createError({ statusCode: 404, statusMessage: "No found autoinformation" })
        if (!OldAutoinformation.portal_id || !OldAutoinformation.bitrix_id || !OldAutoinformation.contract_id || !OldAutoinformation.product_id) {
            const data = await deleteAutoInforPrisma(parseId);
            if (data) return true;
            else return false;
        }
        const contract = await getContractById(OldAutoinformation.contract_id);
        if (!contract || !contract.bitrix_id) throw createError({ statusCode: 404, statusMessage: "No found contract" })
        await acquireLock(contract.bitrix_id, portal.portal.id)
        try {
            const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
            await deleteProducts(company, OldAutoinformation.bitrix_id, OldAutoinformation.product_id!)
            const data = await deleteAutoInforPrisma(parseId);
            if (!data) {
                return false;
            }
            eventsAudit.emit("entity.delete", {
                userid: portal?.user_id,
                entity: entityType.AUTOINFORMATION,
                entityName: data.title,
                companyid: data.contract?.company_id
            } as EventEntity)
            return true;
        } finally {
            await releaseLock(contract.bitrix_id, portal.portal.id);
        }
    }
    else {
        throw createError({
            statusCode: 404,
            statusMessage: "none id"
        })
    }
})
