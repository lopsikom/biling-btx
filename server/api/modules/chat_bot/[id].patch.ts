import { defineModuleUpdateHandler } from '~~/server/services/moduleProvisioning/defineModuleUpdateHandler'
import { chatBotUpdateSpec } from '~~/server/services/moduleProvisioning/specs/chatBotUpdate'

export default defineModuleUpdateHandler(chatBotUpdateSpec)
