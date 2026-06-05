import { contractGetMapPrisma } from "~~/server/utils/mappers";
import { PortalDataType } from "~~/server/utils/prisma/getPortalByUserBitrix";
import { getContractById, requireContract } from "~~/server/utils/prisma/modules/Contract";

export default defineEventHandler(async (event) =>{

    const id = getRouterParams(event).id;
    const portal = event.context.portal as PortalDataType
    let parseId : number;
    if(id){
        try{
            parseId = parseInt(id);
        }catch(e){
            console.error(e);
            throw createError({
                statusCode : 400,
                statusMessage : "Invalid id"
            });
        }
        const verify = await requireContract(parseId, portal.portal.id)
        if (!verify) throw createError({ statusCode: 404, statusMessage: "not verify portal" })
        const contract = await getContractById(parseId);
            if(!contract){
                throw createError({
                    statusCode : 404,
                    statusMessage : "no found contract"
                })
            }
            return contractGetMapPrisma(contract);
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }


})