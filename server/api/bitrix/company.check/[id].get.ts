import { initCompanyClient } from "~~/server/services/bitrix/CompanyClient";
import getCompanyPrisma from "~~/server/utils/prisma/getCompany";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";


export default defineEventHandler(async (event) => {
    const portal = event.context.portal as PortalDataType;
    const id = getRouterParams(event).id;
    let parseId : number;
    if(id){
        try{
            parseId = parseInt(id);
        }catch(e){
            console.log(e);
            throw createError({
                statusCode: 400,
                statusMessage : "invalid id"
            })
        }
        const company = await getCompanyPrisma(id)
        if(company) return true
        else{
            const companyClient = await initCompanyClient(parseId, portal!.portal)
            console.log(companyClient)
            if(companyClient) return true
            else return false
        }
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "invalid id"
        })
    }
})