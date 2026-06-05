import { user_bitrix } from "~~/server/services/models/generated/prisma/client";
import { user_bitrixCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";

export function upsertUserPrisma(
  id: number,
  user: user_bitrixCreateInput
): Promise<UserPrisma>;

export function upsertUserPrisma(
  id: number,
  users: user_bitrixCreateInput[]
): Promise<UserPrisma[]>;

export async function upsertUserPrisma(
  id: number,
  data: user_bitrixCreateInput | user_bitrixCreateInput[]
): Promise<UserPrisma | UserPrisma[]> {

  const upsertOne = async (user: user_bitrixCreateInput) => {
    return prisma.user_bitrix.upsert({
      where: {
        bitrix_id_portal_id: {
          bitrix_id: user.bitrix_id,
          portal_id: id
        }
      },
      update: user,
      create: user
    });
  };

  if (Array.isArray(data)) {
    return Promise.all(data.map(upsertOne));
  }

  return upsertOne(data);
}
export async function getUserPrisma(id : number): Promise<user_bitrix | null>
export async function getUserPrisma(id : string, portal_id : number): Promise<user_bitrix | null>
export async function getUserPrisma(id : string | number, portal_id? : number): Promise<user_bitrix | null>{
    const where = typeof id === "string" ? {bitrix_id : id, portal_id : portal_id} : {id : id}
    const response = await prisma.user_bitrix.findFirst({
        where : where
    })
    return response
}

export async function getUsersPrisma(portal_id : number, select? : any){
  const response = await prisma.user_bitrix.findMany({
    where : {
      portal_id : portal_id
    },
    select : select
  })
  return response;
}

export async function postUserPrisma(data : user_bitrixCreateInput) {
    const response = await prisma.user_bitrix.create({data :data})
    return response
}


export type UserPrisma = Awaited<ReturnType<typeof postUserPrisma>>