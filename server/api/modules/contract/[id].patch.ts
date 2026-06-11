import { contractUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { contractMapBitrix, contractUpdateMapPrisma } from "~~/server/utils/mappers";
import { patchContractPrisma, requireContract } from "~~/server/utils/prisma/modules/Contract";
import * as z from "zod"
import { ContractUpdate, entityType } from "~~/shared/models/APIModels";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import companyClient from "~~/server/services/bitrix/CompanyClient";
import getMyCompanysCache from "~~/server/utils/redis/getMyCompanys";
import { acquireLock, releaseLock } from "~~/server/utils/redis/webHookLocker";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    const body = await readBody(event);

    if (!id) throw createError({ statusCode: 404, statusMessage: "none id" })

    try {
        const parseId = z.coerce.number().parse(id)
        const verify = await requireContract(parseId, portal.portal.id)
        if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
        const data = await ContractUpdate.parseAsync(body)
        const contract = await patchContractPrisma(parseId, contractUpdateMapPrisma(data));

        if (!contract) throw createError({ statusCode: 404, statusMessage: "no found contract" })

        if (contract.bitrix_id) {
            await acquireLock(contract.bitrix_id, portal.portal.id)
            try {
                const CompanyClient = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
                const myCompanys = await getMyCompanysCache(portal)
                const myCompany = myCompanys.find(c => c.title === data.org_name) ?? myCompanys[0]
                await CompanyClient.patchContract(await contractMapBitrix(data, { company_id: myCompany.id }), contract.bitrix_id)
            } finally {
                await releaseLock(contract.bitrix_id, portal.portal.id)
            }
        }

        eventsAudit.emit("entity.update", {
            userid: portal?.user_id,
            entity: entityType.CONTRACT,
            entityName: contract.name,
            companyid: contract.company_id
        } as EventEntity)

        return contractGetMapPrisma(contract)

    } catch (e) {
        console.error(e);
        if (e instanceof z.ZodError) {
            const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
            throw createError({ statusCode: 400, statusMessage: "Vallidation Error", message: mess })
        }
        throw createError({ statusCode: 500, statusMessage: "Server Error" })
    }
})
