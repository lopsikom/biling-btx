import { contractGetMapPrisma } from "~~/server/utils/mappers";

export default defineEventHandler(async (event) =>{

    const id = getRouterParams(event).id;
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