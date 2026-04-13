import { ZodError } from "zod";
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { contractInputMapPrisma, contractMapBitrix } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { addContractPrisma } from "~~/server/utils/prisma/modules/Contract";
import getMyCompanysCache from "~~/server/utils/redis/getMyCompanys";
import { ContractPost, entityType } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const portal_id = event.context.portal as PortalDataType;
    const body = await readBody(event);
    try{
        const ZBody = await ContractPost.parseAsync(body);
        const bitrixCompany =  new companyClient(portal_id!.portal.domain, portal_id!.portal.id, ZBody.bitrix_id!);
        const myCompanys = await getMyCompanysCache(portal_id)
        const myCompany = myCompanys.find(c => c.title === ZBody.org_name) ?? myCompanys[0] 
        const bitirixContract = await bitrixCompany.addContract(contractMapBitrix(ZBody, portal_id!.user_id, myCompany.id))
        const contract = await addContractPrisma(contractInputMapPrisma(ZBody, portal_id!.portal.id, bitirixContract.result.item.id!));
        setResponseStatus(event, 201);
        eventsAudit.emit("entity.create", {
            userid : portal_id?.user_id,
            entity : entityType.CONTRACT,
            entityName : contract.name,
            companyid : contract.company_id
        } as EventEntity)
        return contractGetMapPrisma(contract);
    }catch(e){
        console.error(e)
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

})