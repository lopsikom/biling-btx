import { webformUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default function patchWebformPrisma(id : number, data : webformUpdateInput){ //Добавить добавление и удаление интеграций
    const response = prisma.webform.update({
        where : {
            id : id
        },
        data : data
    })
    return response
}