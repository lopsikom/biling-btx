import * as z from 'zod'
import { replaceFieldGroupsForKind } from '~~/server/utils/prisma/FieldGroup'
import { invalidateCatalogMirror } from '~~/server/services/catalogMetadata'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { requireRole } from '~~/server/utils/requireRole'
import type { IFieldGroup } from '~~/shared/models/APIModels'
import { fault, refusal, zodFields } from '~~/server/utils/errors'
import { isError } from 'h3'

const FieldGroupsPatch = z.object({
  parent_product_id: z.number().int().positive(),
  groups: z.array(z.object({
    name: z.string().min(1),
    fields: z.array(z.string().min(1)).min(1)
  }))
})

// Replace-запись групп полей одного вида модуля. Пустой groups → очистка.
// Зеркало каталога инвалидируется: метадата отдаст новые группы при следующем запросе.
export default defineEventHandler(async (event): Promise<IFieldGroup[]> => {
  requireRole(event, 'admin')
  const portalCtx = event.context.portal as PortalDataType
  try {
    const body = FieldGroupsPatch.parse(await readBody(event))
    const seen = new Set<string>()
    for (const g of body.groups) {
      for (const code of g.fields) {
        if (seen.has(code)) throw refusal('validation.failed', 400, { message: `Поле ${code} состоит более чем в одной группе`, details: { fields: [code] } })
        seen.add(code)
      }
    }
    const groups = await replaceFieldGroupsForKind(portalCtx.portal.id, body.parent_product_id, body.groups)
    await invalidateCatalogMirror(portalCtx.portal.id)
    return groups
  } catch (e) {
    if (e instanceof z.ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw refusal('validation.failed', 400, { message: mess, details: zodFields(e) })
    }
    if (isError(e)) throw e
    throw fault('internal', { cause: e })
  }
})
