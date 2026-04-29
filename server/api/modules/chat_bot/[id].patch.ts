import { ZodError } from "zod";
import * as z from "zod"
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { chatBotGetMapPrisma, chatBotInputUpdateMapPrisma } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getChatBotById, patchChatBotPrisma } from "~~/server/utils/prisma/modules/ChatBot";
import { getContractById } from "~~/server/utils/prisma/modules/Contract";
import { switchContractProduct, updateProductBitrix } from "~~/server/utils/ProductBitrix";
import { chatBotPropsForCatalog } from "~~/server/utils/bitrixProductProps";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";
import { ChatBotUpdate, entityType } from "~~/shared/models/APIModels";
import { IProductCatalogCreate, ProductEnum } from "~~/shared/models/bitrixModels";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType;
    const body = await readBody(event);
    if (id) {
        try {
            const parseId = z.coerce.number().parse(id)
            const ZData = await ChatBotUpdate.parseAsync(body)
            const prismaData = chatBotInputUpdateMapPrisma(ZData)
            const OldChatBot = await getChatBotById(parseId);
            if (!OldChatBot || !OldChatBot.bitrix_id || !OldChatBot.contract_id) throw createError({ statusCode: 404, statusMessage: "No found chat bot" })
            const contract = await getContractById(OldChatBot.contract_id);
            if (!contract || !contract.bitrix_id) throw createError({ statusCode: 404, statusMessage: "No found contract" })
            await acquireLock(contract.bitrix_id, portal.portal.id)
            try {
                const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
                const catalogProps = chatBotPropsForCatalog(ZData.messengers)
                await updateProductBitrix<IProductCatalogCreate>(company, {
                    rowBody: { row_id: OldChatBot.bitrix_id, body: { productName: ZData.title, price: ZData.price } },
                    catalogBody: catalogProps && OldChatBot.product_id ? { product_id: OldChatBot.product_id, body: catalogProps as unknown as Partial<IProductCatalogCreate> } : undefined
                })
                if (ZData.contract_id) {
                    const newContract = await getContractById(ZData.contract_id);
                    if (newContract && newContract.bitrix_id) {
                        await acquireLock(newContract.bitrix_id, portal.portal.id);
                        try {
                            const newRow = await switchContractProduct(company, portal.portal.id, newContract.bitrix_id, OldChatBot.bitrix_id, ProductEnum.CHAT_BOT)
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
                const chat_bot = await patchChatBotPrisma(parseId, prismaData, ZData.messengers)
                if (!chat_bot) {
                    throw createError({
                        statusCode: 404,
                        statusMessage: "no found chat bot"
                    })
                }
                eventsAudit.emit("entity.update", {
                    userid: portal?.user_id,
                    entity: entityType.CHAT_BOT,
                    entityName: chat_bot.title,
                    companyid: chat_bot.contract?.company_id
                } as EventEntity)
                return chatBotGetMapPrisma(chat_bot)
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
