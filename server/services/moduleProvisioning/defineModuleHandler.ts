import { ZodError } from 'zod'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { provisionModule } from './provisionModule'
import type { ModuleSpec, ProvisionedEntity } from './types'

/**
 * HTTP-адаптер над provisionModule. Владеет транспортом: чтение тела, валидация
 * по Zod-схеме рецепта, маппинг ошибок в статус-коды (Zod → 400, прочее → 500),
 * статус ответа и сборка тела. Доменную логику не содержит — делегирует движку.
 *
 * Возвращает готовый Nitro-хендлер: `export default defineModuleHandler(vatsSpec)`.
 */
export function defineModuleHandler<TBody, TPrisma, TEntity extends ProvisionedEntity, TExtra>(
  spec: ModuleSpec<TBody, TPrisma, TEntity, TExtra>
) {
  return defineEventHandler(async (event) => {
    const portal = event.context.portal as PortalDataType
    try {
      const body = await readBody(event)
      const parsed = await spec.zodSchema.parseAsync(body)

      const { entity, extra } = await provisionModule(spec, parsed, portal)

      setResponseStatus(event, 201)
      return spec.buildResponse ? spec.buildResponse(entity, extra) : entity
    } catch (e) {
      console.error(e)
      if (e instanceof ZodError) {
        const mess = e.issues.map(i => `${i.message} for ${i.path.join(',')}`).join(', ')
        throw createError({ statusCode: 400, statusMessage: 'Validation Error', message: mess })
      }
      // createError из движка (например 404 «No found contract») пробрасываем как есть.
      if (e && typeof e === 'object' && 'statusCode' in e) throw e
      throw createError({ statusCode: 500, statusMessage: 'Server Error' })
    }
  })
}
