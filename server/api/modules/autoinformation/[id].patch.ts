import { defineModuleUpdateHandler } from '~~/server/services/moduleProvisioning/defineModuleUpdateHandler'
import { autoinfoUpdateSpec } from '~~/server/services/moduleProvisioning/specs/autoinfoUpdate'

export default defineModuleUpdateHandler(autoinfoUpdateSpec)
