import { ZodError } from 'zod'
import * as z from 'zod'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { updateModule } from './updateModule'
import type { ProvisionedEntity } from './types'
import type { UpdateModuleSpec } from './updateTypes'

/**
 * HTTP-адаптер над updateModule (PATCH /modules/<x>/[id]). Владеет транспортом:
 * чтение id из роута и тела, валидация по Zod-схеме, маппинг ошибок в статус-коды.
 * Доменную логику делегирует движку.
 *
 * Возвращает готовый Nitro-хендлер: `export default defineModuleUpdateHandler(vatsUpdateSpec)`.
 */
export function defineModuleUpdateHandler<TBody, TPrisma extends Record<string, unknown>, TEntity extends ProvisionedEntity>(
  spec: UpdateModuleSpec<TBody, TPrisma, TEntity>
) {
  return defineEventHandler(async (event) => {
    const rawId = getRouterParams(event).id
    if (!rawId) throw createError({ statusCode: 404, statusMessage: 'none id' })
    const portal = event.context.portal as PortalDataType

    try {
      const id = z.coerce.number().parse(rawId)
      const body = await readBody(event)
      const parsed = await spec.updateSchema.parseAsync(body)

      const { entity } = await updateModule(spec, id, parsed, portal)

      return spec.buildResponse ? spec.buildResponse(entity) : entity
    } catch (e) {
      console.error(e)
      if (e instanceof ZodError) {
        const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
        throw createError({ statusCode: 400, statusMessage: 'Validation Error', message: mess })
      }
      if (e && typeof e === 'object' && 'statusCode' in e) throw e
      throw createError({ statusCode: 500, statusMessage: 'Server Error' })
    }
  })
}
