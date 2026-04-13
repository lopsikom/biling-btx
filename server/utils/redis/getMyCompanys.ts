import bitrixAPI from "~~/server/services/bitrix/bitrixAPI"
import { redisClient } from "~~/server/services/redis"
import { ICacheCompany } from "~~/shared/models/APIModels"
import { ICompanyNew } from "~~/shared/models/bitrixModels"
import { PortalDataType } from "../prisma/getPortalByUserBitrix"
import { getBitrixTokenByRedis } from "../getBitrixToken"

export default async function getMyCompanysCache(portal : PortalDataType, access_token? : string){
    if(!access_token){
        access_token = (await getBitrixTokenByRedis(portal))!.access_token;
    }
    const myCompanyCache = await redisClient.get("myCompanyBitrix")
    let myCompany : ICacheCompany[]
    if(!myCompanyCache){
        const myCompanys = (await bitrixAPI.getItems<ICompanyNew[]>(portal.portal.domain, access_token, "4", {
            "isMyCompany" : "Y"
        })).result.items
        const cache = myCompanys.map(c => {return {id : c.id, title : c.title} as ICacheCompany})
        await redisClient.set("myCompanyBitrix", JSON.stringify(cache));
        myCompany = cache
    }
    else myCompany = JSON.parse(myCompanyCache) as ICacheCompany[]
    return myCompany
}