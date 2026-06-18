import { voiceRobotPatchMapPrimsa } from '~~/server/utils/mappers'
import { getVoiceRobotByIdPrisma, patchVoiceRobotPrisma, requireVoiceRobot } from '~~/server/utils/prisma/modules/VoiceRobot'
import { voiceRobotPropsForCatalog } from '~~/server/utils/bitrixProductProps'
import { entityType, VoiceRobotUpdate, type IVoiceRobotUpdate } from '~~/shared/models/APIModels'
import { ProductEnum } from '~~/shared/models/bitrixModels'
import type { voice_robotUpdateInput } from '~~/server/services/models/generated/prisma/models'
import type { UpdateModuleSpec } from '../updateTypes'

type Entity = NonNullable<Awaited<ReturnType<typeof patchVoiceRobotPrisma>>>

export const voiceRobotUpdateSpec: UpdateModuleSpec<IVoiceRobotUpdate, voice_robotUpdateInput, Entity> = {
  updateSchema: VoiceRobotUpdate,
  mapToPrisma: voiceRobotPatchMapPrimsa,
  productType: () => ProductEnum.VOICE_ROBOT,
  buildCatalogProps: b => voiceRobotPropsForCatalog({ tarrif_id: b.tarrif_id, lines: b.lines }),
  requireOwn: requireVoiceRobot,
  getOld: getVoiceRobotByIdPrisma,
  patch: (id, data) => patchVoiceRobotPrisma(id, data),
  entityType: entityType.VOICE_ROBOT
}
