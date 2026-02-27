import { webformUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default function patchWebformPrisma(id : number, data : webformUpdateInput, integrations? : number[]){
    if(integrations) data.webform_webform_type = {deleteMany: {}, create : integrations.map(i => {return {type_id : i}})}
    const response = prisma.webform.update({
        where : {
            id : id
        },
        data : data,
        include : {
            webform_webform_type : {
                select : {
                    webform_type : {
                        select : {
                            name : true
                        }
                    }
                }
            }
        }
    })
    return response
}