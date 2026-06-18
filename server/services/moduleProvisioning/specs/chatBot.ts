import { chatBotInputUpdateMapPrisma } from '~~/server/utils/mappers'
import { postChatBotPrisma, postChatBotMessengersPrisma } from '~~/server/utils/prisma/modules/ChatBot'
import { chatBotPropsForCatalog } from '~~/server/utils/bitrixProductProps'
import { ChatBotPost, entityType, type IChatBotPost } from '~~/shared/models/APIModels'
import { ProductEnum } from '~~/shared/models/bitrixModels'
import type { chat_botCreateInput } from '~~/server/services/models/generated/prisma/models'
import type { ModuleSpec } from '../types'

type Entity = Awaited<ReturnType<typeof postChatBotPrisma>>
type Extra = Awaited<ReturnType<typeof postChatBotMessengersPrisma>>

export const chatBotSpec: ModuleSpec<IChatBotPost, chat_botCreateInput, Entity, Extra> = {
  zodSchema: ChatBotPost,
  mapToPrisma: b => chatBotInputUpdateMapPrisma(b),
  resolveProductType: () => ProductEnum.CHAT_BOT,
  buildCatalogProps: b => chatBotPropsForCatalog(b.messengers),
  post: postChatBotPrisma,
  afterPersist: (entity, b) => postChatBotMessengersPrisma(entity.id, b.messengers),
  buildResponse: (entity, messengers) => ({ ...entity, tarrif_id: entity.tariff_id, messengers }),
  entityType: entityType.CHAT_BOT
}
