import { autoinformationInputMapPrisma } from "~~/server/utils/mappers";
import { postAutoinformationPrisma } from "~~/server/utils/prisma/modules/AutoInfo";
import { IAutoinformationPost } from "~~/shared/models/APIModels";

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as IAutoinformationPost;
        try{
            const autoinformation_module = await postAutoinformationPrisma(autoinformationInputMapPrisma(body));
            setResponseStatus(event, 201);
            return autoinformation_module
        }catch(e){
            console.error(e);
            throw createError({
                statusCode : 400,
                statusMessage : "Validation error"
            })
        }
})