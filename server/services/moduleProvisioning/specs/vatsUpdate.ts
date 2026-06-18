import { vatsUpdateMapPrisma } from '~~/server/utils/mappers'
import { getVatsById, patchVatsPrisma, requireVats } from '~~/server/utils/prisma/modules/Vats'
import { entityType, VatsUpdate, type IVatsUpdate } from '~~/shared/models/APIModels'
import { ProductEnum } from '~~/shared/models/bitrixModels'
import type { vatsUpdateInput } from '~~/server/services/models/generated/prisma/models'
import type { UpdateModuleSpec } from '../updateTypes'

type Entity = NonNullable<Awaited<ReturnType<typeof patchVatsPrisma>>>

export const vatsUpdateSpec: UpdateModuleSpec<IVatsUpdate, vatsUpdateInput, Entity> = {
  updateSchema: VatsUpdate,
  mapToPrisma: vatsUpdateMapPrisma,
  productType: () => ProductEnum.VATS,
  requireOwn: requireVats,
  getOld: getVatsById,
  patch: (id, data) => patchVatsPrisma(id, data),
  entityType: entityType.VATS
}
