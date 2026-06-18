import { defineModuleUpdateHandler } from '~~/server/services/moduleProvisioning/defineModuleUpdateHandler'
import { voiceRobotUpdateSpec } from '~~/server/services/moduleProvisioning/specs/voiceRobotUpdate'

export default defineModuleUpdateHandler(voiceRobotUpdateSpec)
