import { ZodError } from "zod";
import companyClient from "~~/server/services/bitrix/CompanyClient";
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { vatsInputMapPrisma } from "~~/server/utils/mappers";
import { postVatsPrisma } from "~~/server/utils/prisma/modules/Vats";
import setProductBitrix from "~~/server/utils/setProductBitrix";
import { entityType, VatsPost } from "~~/shared/models/APIModels";
import { IVatsProductCreate, ProductEnum, productRecords } from "~~/shared/models/bitrixModels";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const portal = event.context.portal as PortalDataType;
    try{
        const Zbody = await VatsPost.parseAsync(body);
        const prismaBody = vatsInputMapPrisma(Zbody);
        const contract = await getContractById(Zbody.contract_id);
        if(!contract || !contract.bitrix_id) throw createError({statusCode : 404, statusMessage : "No found contract"})

        const company = new companyClient(portal.portal.domain, portal.portal.id, contract.company.bitrix_id)
        const product = await setProductBitrix<IVatsProductCreate>(company, {contract_id : contract.bitrix_id, data : {price : Zbody.price, productName : Zbody.title} }, {parent_id : productRecords[ProductEnum.VATS].id, data : {name : ProductEnum.VATS, active : Zbody.active ? "Y" : "N"}} )
        prismaBody.bitrix_id = product.productRow.result.productRow.id;
        prismaBody.product_id = product.productCatalog.result.offer.id;
        prismaBody.portal = {connect : {id : portal.portal.id}}
        const vats = await postVatsPrisma(prismaBody);

        eventsAudit.emit("entity.create", {
            userid : portal?.user_id,
            entity : entityType.VATS,
            entityName : vats.title,
            companyid : vats.contract?.company_id
        } as EventEntity)
        setResponseStatus(event, 201);
        return vats
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
})
