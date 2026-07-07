import * as z from 'zod'
import { prisma } from '~~/server/services/prisma/prismaClient'
import { invalidateFieldsMirror } from '~~/server/services/fieldMetadata'
import { invalidateCatalogMirror } from '~~/server/services/catalogMetadata'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { IPortalBinding } from '~~/shared/models/APIModels'

const BindingPatch = z.object({
  contract_entity_type_id: z.number().int().positive().optional(),
  module_product_ids: z.array(z.number().int().positive()).optional()
})

// Смена привязки портала: какой смарт-процесс — договор, какие товары — виды модулей.
// После смены зеркала метаданных инвалидируются — поля перечитаются из нового источника.
export default defineEventHandler(async (event): Promise<IPortalBinding> => {
  const portalCtx = event.context.portal as PortalDataType
  try {
    const body = BindingPatch.parse(await readBody(event))
    const portal = await prisma.portal.update({
      where: { id: portalCtx.portal.id },
      data: {
        contract_entity_type_id: body.contract_entity_type_id,
        module_product_ids: body.module_product_ids
      }
    })
    if (body.contract_entity_type_id) await invalidateFieldsMirror(portal.id, 'contract')
    if (body.module_product_ids !== undefined) await invalidateCatalogMirror(portal.id)
    return {
      contract_entity_type_id: portal.contract_entity_type_id,
      module_product_ids: portal.module_product_ids
    }
  } catch (e) {
    console.error(e)
    if (e instanceof z.ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: mess })
    }
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
