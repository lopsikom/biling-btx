import bitrixAPI from "~~/server/services/bitrix/bitrixAPI";
import getPortalPrisma from "./getPortal";
import { getUserPrisma, upsertUserPrisma } from "./UserBitrix";

export default async function getPortalByUserBitrix(token : string){
        const data = await bitrixAPI.getPortalData(token);
        const {client_id, install} = data.result;
        const portal = await getPortalPrisma({
                domain : install.domain,
                client_id : client_id
        });
        if(!portal) return
        let user = await getUserPrisma(data.result.user_id.toString(), portal.id)
        if(!user) {
                const user_bitrix = await bitrixAPI.getBitrixUser(install.domain, token)
                if(!user_bitrix.result) return
                user = await upsertUserPrisma(portal.id, userMapUpsertPrisma(portal.id, user_bitrix.result))
        }

        return {portal, user_id : user.id, bitrix_user_id : user.bitrix_id}
}
export type PortalDataType = NonNullable<Awaited<ReturnType<typeof getPortalByUserBitrix>>>
// Форма event.context.portal внутри HTTP-хендлеров: requirePortal всегда навешивает
// role поверх PortalDataType после резолва (сама функция выше про isBitrixAdmin не
// знает). Не путать с голым PortalDataType — им пользуются вебхук-хендлеры и
// внутренние хелперы (getBitrixTokenByRedis и т.п.), собирающие контекст в обход
// middleware, где role нет и не нужна.
export interface AuthedPortalDataType extends Omit<PortalDataType, 'portal'>  {
    role?: import('~~/shared/models/APIModels').Role
    portal: Omit<PortalDataType['portal'], 'client_secret'>;
    isBitrixAdmin? : boolean
}