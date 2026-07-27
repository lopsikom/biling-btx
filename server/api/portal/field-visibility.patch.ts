import * as z from 'zod'
import { replaceHiddenFieldsForKind } from '~~/server/utils/prisma/FieldVisibility'
import { invalidateCatalogMirror } from '~~/server/services/catalogMetadata'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'

const FieldVisibilityPatch = z.object({
  parent_product_id: z.number().int().positive(),
  hidden_fields: z.array(z.string().min(1))
})

// Replace-запись скрытых полей одного вида модуля. Пустой hidden_fields → все поля видимы.
// Зеркало каталога инвалидируется: метадата отдаст новую видимость при следующем запросе.
export default defineEventHandler(async (event): Promise<string[]> => {
  const portalCtx = event.context.portal as PortalDataType
  try {
    const body = FieldVisibilityPatch.parse(await readBody(event))
    const hidden = await replaceHiddenFieldsForKind(portalCtx.portal.id, body.parent_product_id, body.hidden_fields)
    await invalidateCatalogMirror(portalCtx.portal.id)
    return hidden
  } catch (e) {
    console.error(e)
    if (e instanceof z.ZodError) {
      const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
      throw createError({ statusCode: 400, statusMessage: 'Vallidation Error', message: mess })
    }
    if (typeof e === 'object' && e && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, statusMessage: 'Server Error' })
  }
})
