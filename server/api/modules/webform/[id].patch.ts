import { defineModuleUpdateHandler } from '~~/server/services/moduleProvisioning/defineModuleUpdateHandler'
import { webformUpdateSpec } from '~~/server/services/moduleProvisioning/specs/webformUpdate'

export default defineModuleUpdateHandler(webformUpdateSpec)
