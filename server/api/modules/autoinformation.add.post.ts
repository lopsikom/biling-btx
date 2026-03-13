import { autoinformationInputMapPrisma } from "~~/server/utils/mappers";
import { postAutoinformationPrisma } from "~~/server/utils/prisma/modules/AutoInfo";
import { AutoInformationPost, entityType, IAutoinformationPost } from "~~/shared/models/APIModels";
import * as z from "zod"
import { eventsAudit, EventEntity } from "~~/server/services/EventsAudit";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as IAutoinformationPost;
    const portal = event.context.portal as PortalDataType
        try{
            const Zbody = await AutoInformationPost.transform(val => autoinformationInputMapPrisma(val)).parseAsync(body)
            const autoinformation_module = await postAutoinformationPrisma(Zbody);
            setResponseStatus(event, 201);
            eventsAudit.emit("entity.create", {
                userid : portal?.user_id,
                entity : entityType.AUTOINFORMATION,
                entityName : autoinformation_module.title,
                companyid : autoinformation_module.contract?.company_id
            } as EventEntity) 
            return autoinformation_module
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
})