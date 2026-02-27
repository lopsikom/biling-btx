import { voice_robotCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export default async function postVoiceRobotPrisma(data : voice_robotCreateInput){
    const response = prisma.voice_robot.create({
        data : data
    })
    return response
}