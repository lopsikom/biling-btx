import { ZodError } from "zod";
import * as z from "zod"
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { voiceRobotPatchMapPrimsa } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getContractById } from "~~/server/utils/prisma/modules/Contract";
import { getVoiceRobotByIdPrisma, patchVoiceRobotPrisma } from "~~/server/utils/prisma/modules/VoiceRobot";
import { switchContractProduct, updateProductBitrix } from "~~/server/utils/ProductBitrix";
import { voiceRobotPropsForCatalog } from "~~/server/utils/bitrixProductProps";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";
import { entityType, VoiceRobotUpdate } from "~~/shared/models/APIModels";
import { IProductCatalogCreate, ProductEnum } from "~~/shared/models/bitrixModels";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType;
    const body = await readBody(event);
    if (id) {
        try {
            const parseId = z.coerce.number().parse(id)
            const ZData = await VoiceRobotUpdate.parseAsync(body)
            const prismaData = voiceRobotPatchMapPrimsa(ZData)
            const OldVoiceRobot = await getVoiceRobotByIdPrisma(parseId);
            if (!OldVoiceRobot || !OldVoiceRobot.bitrix_id || !OldVoiceRobot.contract_id) throw createError({ statusCode: 404, statusMessage: "No found voice robot" })
            const contract = await getContractById(OldVoiceRobot.contract_id);
            if (!contract || !contract.bitrix_id) throw createError({ statusCode: 404, statusMessage: "No found contract" })
            await acquireLock(contract.bitrix_id, portal.portal.id)
            try {
                const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
                const catalogProps = voiceRobotPropsForCatalog({ tarrif_id: ZData.tarrif_id, lines: ZData.lines })
                await updateProductBitrix<IProductCatalogCreate>(company, {
                    rowBody: { row_id: OldVoiceRobot.bitrix_id, body: { productName: ZData.title, price: ZData.price } },
                    catalogBody: catalogProps && OldVoiceRobot.product_id ? { product_id: OldVoiceRobot.product_id, body: catalogProps as unknown as Partial<IProductCatalogCreate> } : undefined
                })
                if (ZData.contract_id) {
                    const newContract = await getContractById(ZData.contract_id);
                    if (newContract && newContract.bitrix_id) {
                        await acquireLock(newContract.bitrix_id, portal.portal.id);
                        try {
                            const newRow = await switchContractProduct(company, portal.portal.id, newContract.bitrix_id, OldVoiceRobot.bitrix_id, ProductEnum.VOICE_ROBOT)
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
                const voice_robot = await patchVoiceRobotPrisma(parseId, prismaData);
                if (!voice_robot) {
                    throw createError({
                        statusCode: 404,
                        statusMessage: "no found voice robot"
                    })
                }
                eventsAudit.emit("entity.update", {
                    userid: portal?.user_id,
                    entity: entityType.VOICE_ROBOT,
                    entityName: voice_robot.title,
                    companyid: voice_robot.contract?.company_id
                } as EventEntity)
                return voice_robot
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
