import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function deleteVoiceRobotPrisma(id : number){
    const response = await prisma.voice_robot.delete({
        where : {id : id}
    })
    return response
}