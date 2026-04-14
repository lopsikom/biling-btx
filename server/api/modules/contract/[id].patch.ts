import { contractUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { contractMapBitrix, contractUpdateMapPrisma } from "~~/server/utils/mappers";
import { patchContractPrisma } from "~~/server/utils/prisma/modules/Contract";
import * as z from "zod"
import { ContractUpdate, entityType } from "~~/shared/models/APIModels";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import companyClient from "~~/server/services/bitrix/CompanyClient";

export default defineEventHandler(async (event) => {
    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    const body = await readBody(event);
        if(id){
            try{
                const data = await ContractUpdate.parseAsync(body)
                const contract = await patchContractPrisma(z.coerce.number().parse(id), contractUpdateMapPrisma(data));
                if(contract.bitrix_id){
                    const CompanyClient = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
                    CompanyClient.patchContract(contractMapBitrix(data), contract.bitrix_id)
                }

                if(!contract){
                    throw createError({
                        statusCode : 404,
                        statusMessage : "no found contract"
                    })
                }
                eventsAudit.emit("entity.update", {
                    userid : portal?.user_id,
                    entity : entityType.CONTRACT,
                    entityName : contract.name,
                    companyid : contract.company_id
                } as EventEntity)
                return contractGetMapPrisma(contract);
            }catch(e){
                console.error(e);
                if(e instanceof z.ZodError){
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