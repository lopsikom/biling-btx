import * as z from 'zod'
import { prisma } from '~~/server/services/prisma/prismaClient'
import { invalidateFieldsMirror } from '~~/server/services/fieldMetadata'
import { invalidateCatalogMirror } from '~~/server/services/catalogMetadata'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { requireRole } from '~~/server/utils/requireRole'
import type { IPortalBinding } from '~~/shared/models/APIModels'
import { fault, refusal, zodFields } from '~~/server/utils/errors'

const BindingPatch = z.object({
  contract_entity_type_id: z.number().int().positive().optional(),
  module_root_section_id: z.number().int().positive().optional()
})

// Смена привязки портала: какой смарт-процесс — договор, какие товары — виды модулей.
// После смены зеркала метаданных инвалидируются — поля перечитаются из нового источника.
export default defineEventHandler(async (event): Promise<IPortalBinding> => {
  requireRole(event, 'admin')
  const portalCtx = event.context.portal as PortalDataType
  try {
    const body = BindingPatch.parse(await readBody(event))
    const portal = await prisma.portal.update({
      where: { id: portalCtx.portal.id },
      data: {
        contract_entity_type_id: body.contract_entity_type_id,
        module_root_section_id: body.module_root_section_id
      }
    })
    if (body.contract_entity_type_id) await invalidateFieldsMirror(portal.id, 'contract')
    if (body.module_root_section_id !== undefined) await invalidateCatalogMirror(portal.id)
    return {
      contract_entity_type_id: portal.contract_entity_type_id,
      module_root_section_id: portal.module_root_section_id
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw refusal('validation.failed', 400, { message: mess, details: zodFields(e) })
    }
    throw fault('internal', { cause: e })
  }
})
