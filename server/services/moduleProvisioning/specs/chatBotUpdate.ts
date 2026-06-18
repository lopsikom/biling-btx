import { chatBotGetMapPrisma, chatBotInputUpdateMapPrisma } from '~~/server/utils/mappers'
import { getChatBotById, patchChatBotPrisma, requireChatBot } from '~~/server/utils/prisma/modules/ChatBot'
import { chatBotPropsForCatalog } from '~~/server/utils/bitrixProductProps'
import { ChatBotUpdate, entityType, type IChatBotUpdate } from '~~/shared/models/APIModels'
import { ProductEnum } from '~~/shared/models/bitrixModels'
import type { chat_botUpdateInput } from '~~/server/services/models/generated/prisma/models'
import type { UpdateModuleSpec } from '../updateTypes'

type Entity = NonNullable<Awaited<ReturnType<typeof patchChatBotPrisma>>>

export const chatBotUpdateSpec: UpdateModuleSpec<IChatBotUpdate, chat_botUpdateInput, Entity> = {
  updateSchema: ChatBotUpdate,
  mapToPrisma: b => chatBotInputUpdateMapPrisma(b),
  productType: () => ProductEnum.CHAT_BOT,
  buildCatalogProps: b => chatBotPropsForCatalog(b.messengers),
  requireOwn: requireChatBot,
  getOld: getChatBotById,
  patch: (id, data, body) => patchChatBotPrisma(id, data, body.messengers),
  buildResponse: entity => chatBotGetMapPrisma(entity),
  entityType: entityType.CHAT_BOT
}
