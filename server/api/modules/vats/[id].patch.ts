import { defineModuleUpdateHandler } from '~~/server/services/moduleProvisioning/defineModuleUpdateHandler'
import { vatsUpdateSpec } from '~~/server/services/moduleProvisioning/specs/vatsUpdate'

export default defineModuleUpdateHandler(vatsUpdateSpec)
