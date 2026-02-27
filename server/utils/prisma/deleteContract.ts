import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function deleteContractPrisma(id : number){
    const response = await prisma.$transaction([
        prisma.webform.updateMany({
            where : {contract_id : id},
            data : {contract_id : null}
        }),
        prisma.autoinformation_module.updateMany({
            where : {contract_id : id},
            data : {contract_id : null}
        }),
        prisma.vats.updateMany({
            where : {contract_id : id},
            data : {contract_id : null},
        }),
        prisma.voice_robot.updateMany({
            where : {contract_id : id},
            data : {contract_id : null}
        }),
        prisma.chat_bot.updateMany({
            where : {contract_id : id},
            data : {contract_id : null}
        }),
        prisma.contract.delete({
            where : {
                id : id
            }
        })
    ])
    return response
}