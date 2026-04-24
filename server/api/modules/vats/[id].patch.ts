import { ZodError } from "zod";
import { vatsUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { patchVatsPrisma } from "~~/server/utils/prisma/modules/Vats";
import { entityType, VatsUpdate } from "~~/shared/models/APIModels";
import * as z from "zod"
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { switchContractProduct, updateProductBitrix } from "~~/server/utils/ProductBitrix";
import { IVatsProductCreate, ProductEnum } from "~~/shared/models/bitrixModels";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType;
    const body = await readBody(event);
        if(id){
            try{ // Рефактор обновления сущности в битриксе с разделением полей на разные запросы
                const parseId = z.coerce.number().parse(id)
                const ZData = await VatsUpdate.parseAsync(body)
                const prismaData = vatsUpdateMapPrisma(ZData)
                const OldVats = await getVatsById(parseId);
                console.log(ZData)
                if(!OldVats || !OldVats.bitrix_id || !OldVats.contract_id) throw createError({statusCode : 404, statusMessage : "No found vats"})
                const contract = await getContractById(OldVats.contract_id);
                if(!contract || !contract.bitrix_id) throw createError({statusCode : 404, statusMessage : "No found contract"})
                await acquireLock(contract.bitrix_id, portal.portal.id)
                try{
                    const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
                    await updateProductBitrix<IVatsProductCreate>(company, {rowBody : {row_id : OldVats?.bitrix_id, body : {name : ZData.title}}})
                    if(ZData.contract_id) {
                        const newContract = await getContractById(ZData.contract_id);
                        if(newContract && newContract.bitrix_id){
                            await acquireLock(newContract.bitrix_id, portal.portal.id);
                            try{
                                const newRow = await switchContractProduct(company, portal.portal.id, ZData.contract_id, OldVats.bitrix_id, ProductEnum.VATS)
                                if(newRow){
                                    prismaData.bitrix_id = newRow.result.productRow.id
                                }
                                else{
                                    delete prismaData.contract
                                }
                            }
                            finally{
                                await releaseLock(newContract.bitrix_id, portal.portal.id);
                            }
                        }
                        }
                    const vats = await patchVatsPrisma(parseId, prismaData);
                    if(!vats){
                        throw createError({
                            statusCode : 404,
                            statusMessage : "no found vats"
                        })
                    }
                    eventsAudit.emit("entity.update", {
                        userid : portal?.user_id,
                        entity : entityType.VATS,
                        entityName : vats.title,
                        companyid : vats.contract?.company_id
                    } as EventEntity)
                    return vats
                }finally{
                    await releaseLock(contract.bitrix_id, portal.portal.id)
                }
            }catch(e){
                console.error(e);
                if(e instanceof ZodError){
                    console.error(e.issues);
                    const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
                    throw createError({
                        statusCode : 400,
                        statusMessage : "Vallidation Error",
                        message : mess
                    })
                }
                else {
                    throw createError({
                        statusCode: 500,
                        statusMessage : "Server Error"
                    })
                }
            }
        }
        else{
            throw createError({
                statusCode : 404,
                statusMessage : "none id"
            })
        }
})