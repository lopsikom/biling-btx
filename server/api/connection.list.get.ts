import { ConnectionPatch, IConnectionPatch } from "~~/shared/models/APIModels";
import { prisma } from "../services/prisma/prismaClient";
import { connectionGetListPrisma } from "../utils/prisma/Connection";
import { ZodError } from "zod";
import { fault, refusal, zodFields } from '~~/server/utils/errors'

export default defineEventHandler(async (event) => {
    try{
        const portal = event.context.portal;
        if(!portal) {
            throw createError({
                statusCode: 401
            })
        }
        const query = getQuery(event);
        let filter : IConnectionPatch | undefined = undefined;
        if(query.filter){   
            try{
                filter = JSON.parse(query.filter as string)
            }catch(e){
                console.warn("Невалидный filter JSON", query.filter)
                throw createError({
                    statusCode : 400,
                    statusMessage : "Invalid filter"
                })
            }
        }
        if(filter) filter = ConnectionPatch.parse(filter)
        const data = await connectionGetListPrisma({filter : filter, portal_id : portal.id})
        return data
        }catch(e){
            if(e instanceof ZodError){
                const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(", ")
                throw refusal('validation.failed', 400, { message: mess, details: zodFields(e) })
            }
            else {
                throw fault('internal', { cause: e })
            }
        }
})