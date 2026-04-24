import * as z from "zod";
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { EventEntity, eventsAudit } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { deleteVatsPrisma } from "~~/server/utils/prisma/modules/Vats";
import { deleteProducts } from "~~/server/utils/ProductBitrix";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";
import { entityType } from "~~/shared/models/APIModels";


export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    if(id){
        const parseId = z.coerce.number().parse(id)
        const contract = await getContractById(parseId);
        if(!contract || !contract.bitrix_id) throw createError({statusCode : 404, statusMessage : "No found contract"})
        const OldVats = await getVatsById(parseId);
        if(!OldVats || !OldVats.bitrix_id) throw createError({statusCode : 404, statusMessage : "No found vats"})
        await acquireLock(contract.bitrix_id, portal.portal.id)
        try{
            const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
            await deleteProducts(company, OldVats.bitrix_id, OldVats.product_id!)
            const data = await deleteVatsPrisma(parseId);
            if(!data){
                return false;
            }
            eventsAudit.emit("entity.delete", {
                userid : portal?.user_id,
                entity : entityType.VATS,
                entityName : data.title,
                companyid : data.contract?.company_id
            } as EventEntity) 
            return true;
        }finally{
            await releaseLock(contract.bitrix_id, portal.portal.id);
        }
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})