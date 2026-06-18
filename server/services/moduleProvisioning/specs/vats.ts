import { vatsInputMapPrisma } from '~~/server/utils/mappers'
import { postVatsPrisma } from '~~/server/utils/prisma/modules/Vats'
import { entityType, VatsPost, type IVatsPost } from '~~/shared/models/APIModels'
import { ProductEnum } from '~~/shared/models/bitrixModels'
import type { ModuleSpec } from '../types'

type Entity = Awaited<ReturnType<typeof postVatsPrisma>>

export const vatsSpec: ModuleSpec<IVatsPost, ReturnType<typeof vatsInputMapPrisma>, Entity, void> = {
  zodSchema: VatsPost,
  mapToPrisma: vatsInputMapPrisma,
  resolveProductType: () => ProductEnum.VATS,
  post: postVatsPrisma,
  entityType: entityType.VATS
}
