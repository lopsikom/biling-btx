import { voiceRobotInputMapPrisma } from '~~/server/utils/mappers'
import { postVoiceRobotPrisma } from '~~/server/utils/prisma/modules/VoiceRobot'
import { voiceRobotPropsForCatalog } from '~~/server/utils/bitrixProductProps'
import { entityType, VoiceRobotPost, type IVoiceRobotPost } from '~~/shared/models/APIModels'
import { ProductEnum } from '~~/shared/models/bitrixModels'
import type { ModuleSpec } from '../types'

type Entity = Awaited<ReturnType<typeof postVoiceRobotPrisma>>

export const voiceRobotSpec: ModuleSpec<IVoiceRobotPost, ReturnType<typeof voiceRobotInputMapPrisma>, Entity, void> = {
  zodSchema: VoiceRobotPost,
  mapToPrisma: voiceRobotInputMapPrisma,
  resolveProductType: () => ProductEnum.VOICE_ROBOT,
  buildCatalogProps: b => voiceRobotPropsForCatalog({ tarrif_id: b.tarrif_id, lines: b.lines }),
  post: postVoiceRobotPrisma,
  entityType: entityType.VOICE_ROBOT
}
