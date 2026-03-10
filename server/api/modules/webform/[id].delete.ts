import { deleteWebForm } from "~~/server/utils/prisma/modules/WebForm";

export default defineEventHandler(async (event) => {
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
        const data = await deleteWebForm(parseId);
            if(!data){
                return false;
            }
            return true;
    }
    else{
        throw createError({
            statusCode : 404,
            statusMessage : "none id"
        })
    }
})