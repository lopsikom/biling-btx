import { webformInputUpdateMapPrisma } from '~~/server/utils/mappers'
import { postWebFormPrisma, postWebFormTypePrisma } from '~~/server/utils/prisma/modules/WebForm'
import { webformPropsForCatalog } from '~~/server/utils/bitrixProductProps'
import { entityType, WebFormPost, type IWebformPost } from '~~/shared/models/APIModels'
import { ProductEnum } from '~~/shared/models/bitrixModels'
import type { webformCreateInput } from '~~/server/services/models/generated/prisma/models'
import type { ModuleSpec } from '../types'

type Entity = Awaited<ReturnType<typeof postWebFormPrisma>>
type Extra = Awaited<ReturnType<typeof postWebFormTypePrisma>>

export const webformSpec: ModuleSpec<IWebformPost, webformCreateInput, Entity, Extra> = {
  zodSchema: WebFormPost,
  mapToPrisma: b => webformInputUpdateMapPrisma(b),
  resolveProductType: () => ProductEnum.WEB_FORM,
  buildCatalogProps: b => webformPropsForCatalog({ tarrif_id: b.tarrif_id }),
  post: postWebFormPrisma,
  afterPersist: (entity, b) => postWebFormTypePrisma(entity.id, b.integrations),
  buildResponse: (entity, integrations) => ({
    ...entity,
    integrations: integrations.map((i: { webform_type: { name: string } }) => i.webform_type.name)
  }),
  entityType: entityType.WEBFORM
}
