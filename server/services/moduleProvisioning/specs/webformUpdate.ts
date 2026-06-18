import { webformGetMapPrisma, webformInputUpdateMapPrisma } from '~~/server/utils/mappers'
import { getWebformByIdPrisma, patchWebformPrisma, requireWebform } from '~~/server/utils/prisma/modules/WebForm'
import { webformPropsForCatalog } from '~~/server/utils/bitrixProductProps'
import { entityType, WebFormFilterUpdate, type IWebFormFilterUpdate } from '~~/shared/models/APIModels'
import { ProductEnum } from '~~/shared/models/bitrixModels'
import type { webformUpdateInput } from '~~/server/services/models/generated/prisma/models'
import type { UpdateModuleSpec } from '../updateTypes'

type Entity = NonNullable<Awaited<ReturnType<typeof patchWebformPrisma>>>

export const webformUpdateSpec: UpdateModuleSpec<IWebFormFilterUpdate, webformUpdateInput, Entity> = {
  updateSchema: WebFormFilterUpdate,
  mapToPrisma: b => webformInputUpdateMapPrisma(b),
  productType: () => ProductEnum.WEB_FORM,
  buildCatalogProps: b => webformPropsForCatalog({ tarrif_id: b.tarrif_id }),
  requireOwn: requireWebform,
  getOld: getWebformByIdPrisma,
  patch: (id, data, body) => patchWebformPrisma(id, data, body.integrations),
  buildResponse: entity => webformGetMapPrisma(entity),
  entityType: entityType.WEBFORM
}
