import { autoinformationInputMapPrisma } from '~~/server/utils/mappers'
import { postAutoinformationPrisma } from '~~/server/utils/prisma/modules/AutoInfo'
import { autoinformationProductTypeByTypeId, autoinformationPropsForCatalog } from '~~/server/utils/bitrixProductProps'
import { AutoInformationPost, entityType, type IAutoinformationPost } from '~~/shared/models/APIModels'
import type { autoinformation_moduleCreateInput } from '~~/server/services/models/generated/prisma/models'
import type { ModuleSpec } from '../types'

type Entity = Awaited<ReturnType<typeof postAutoinformationPrisma>>

export const autoinfoSpec: ModuleSpec<IAutoinformationPost, autoinformation_moduleCreateInput, Entity, void> = {
  zodSchema: AutoInformationPost,
  mapToPrisma: b => autoinformationInputMapPrisma(b),
  // тип вычисляется из тела: обзвон и SMS-рассылка — один модуль, разные product-типы
  resolveProductType: b => autoinformationProductTypeByTypeId(b.type_id),
  buildCatalogProps: b => autoinformationPropsForCatalog(b.type_id),
  post: postAutoinformationPrisma,
  entityType: entityType.AUTOINFORMATION
}
