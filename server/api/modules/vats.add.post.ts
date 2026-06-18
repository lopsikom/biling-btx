import { defineModuleHandler } from '~~/server/services/moduleProvisioning/defineModuleHandler'
import { vatsSpec } from '~~/server/services/moduleProvisioning/specs/vats'

export default defineModuleHandler(vatsSpec)
