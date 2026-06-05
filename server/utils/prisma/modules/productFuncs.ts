import { IAutoInfoProduct, IChatBotProduct, IProductRow, ISmsProduct, IVatsProduct, IVoiceRobotProduct, IWebFormProdruct, ProductEnum } from "~~/server/services/models";
import { postChatBotProductPrisma, upsertChatBotProductPrisma, deleteChatBotPrisma } from "./ChatBot";
import { postVoiceRobotProductPrisma, upsertVoiceRobotProductPrisma, deleteVoiceRobotPrisma } from "./VoiceRobot";
import { postVatsProductPrisma, upsertVatsProductPrisma, deleteVatsPrisma } from "./Vats";
import { postWebFormProducPrisma, upsertWebFormProductPrisma, deleteWebForm } from "./WebForm";
import { postAutoInformationProductPrisma, upsertAutoInformationProductPrisma, deleteAutoInforPrisma } from "./AutoInfo";

export type ProductDataMap = {
  [ProductEnum.CHAT_BOT]: { info: IChatBotProduct; productRows: IProductRow };
  [ProductEnum.VOICE_ROBOT]: { info: IVoiceRobotProduct; productRows: IProductRow };
  [ProductEnum.VATS]: { info: IVatsProduct; productRows: IProductRow };
  [ProductEnum.WEB_FORM]: { info: IWebFormProdruct; productRows: IProductRow };
  [ProductEnum.SMS]: { info: ISmsProduct; productRows: IProductRow };
  [ProductEnum.AUTOINFO]: { info: IAutoInfoProduct; productRows: IProductRow };
};

export type ProductFuncRecord = {
  [K in keyof ProductDataMap]: (data: ProductDataMap[K], portal_id: number) => Promise<any>;
};

export const productFuncUpsertRecord: ProductFuncRecord = {
  [ProductEnum.CHAT_BOT]: async (data, portal_id) => { return await upsertChatBotProductPrisma(data, portal_id) },
  [ProductEnum.VOICE_ROBOT]: async (data, portal_id) => { return await upsertVoiceRobotProductPrisma(data, portal_id) },
  [ProductEnum.VATS]: async (data, portal_id) => { return await upsertVatsProductPrisma(data, portal_id) },
  [ProductEnum.WEB_FORM]: async (data, portal_id) => { return await upsertWebFormProductPrisma(data, portal_id) },
  [ProductEnum.SMS]: async (data, portal_id) => { return await upsertAutoInformationProductPrisma(data, portal_id) },
  [ProductEnum.AUTOINFO]: async (data, portal_id) => { return await upsertAutoInformationProductPrisma(data, portal_id) }
};

export const productFuncCreateRecord: ProductFuncRecord = {
  [ProductEnum.CHAT_BOT]: async (data, portal_id) => { return await postChatBotProductPrisma(data, portal_id) },
  [ProductEnum.VOICE_ROBOT]: async (data, portal_id) => { return await postVoiceRobotProductPrisma(data, portal_id) },
  [ProductEnum.VATS]: async (data, portal_id) => { return await postVatsProductPrisma(data, portal_id) },
  [ProductEnum.WEB_FORM]: async (data, portal_id) => { return await postWebFormProducPrisma(data, portal_id) },
  [ProductEnum.SMS]: async (data, portal_id) => { return await postAutoInformationProductPrisma(data, portal_id) },
  [ProductEnum.AUTOINFO]: async (data, portal_id) => { return await postAutoInformationProductPrisma(data, portal_id) }
};

export const productFuncDeleteRecord = {
  [ProductEnum.CHAT_BOT]: async (id: number, portal_id: number) => { return await deleteChatBotPrisma(id, portal_id) },
  [ProductEnum.VOICE_ROBOT]: async (id: number, portal_id: number) => { return await deleteVoiceRobotPrisma(id, portal_id) },
  [ProductEnum.VATS]: async (id: number, portal_id: number) => { return await deleteVatsPrisma(id, portal_id) },
  [ProductEnum.WEB_FORM]: async (id: number, portal_id: number) => { return await deleteWebForm(id, portal_id) },
  [ProductEnum.SMS]: async (id: number, portal_id: number) => { return await deleteAutoInforPrisma(id, portal_id) },
  [ProductEnum.AUTOINFO]: async (id: number, portal_id: number) => { return await deleteAutoInforPrisma(id, portal_id) }
};
