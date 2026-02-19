import { voice_robotUpdateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function patchVoiceRobotPrisma(id : number, data : voice_robotUpdateInput){
    const response = prisma.voice_robot.update({
        where : {
            id : id
        },
        data : data
    })
    return response
}