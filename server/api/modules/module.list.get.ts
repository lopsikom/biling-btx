import z, { ZodError } from 'zod'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { getModuleList, moduleToApi } from '~~/server/utils/prisma/modules/Module'
import { healZeroKindModules } from '~~/server/services/contractProductSync/healContractModules'
import { ModuleFilter, type IModuleFilter } from '~~/shared/models/APIModels'
import { fault, refusal, zodFields } from '~~/server/utils/errors'
import { isError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const portal = event.context.portal as PortalDataType
    const { filter } = getQuery(event)
    let filterParse: IModuleFilter | undefined
    if (filter) {
      try { filterParse = ModuleFilter.parse(JSON.parse(filter as string)) } catch (e) {
        if (e instanceof ZodError) throw e
        throw refusal('validation.failed', 400, { message: 'Некорректный фильтр' })
      }
    }
    let data = await getModuleList(portal.portal.id, filterParse)
    // Self-heal: если есть модули с parent_product_id=0 (плейсхолдер миграции) —
    // пересинкаем их договоры из Bitrix и перечитываем (см. healZeroKindModules).
    if (data.some(m => m.parent_product_id === 0)) {
      const healed = await healZeroKindModules(data, portal)
      if (healed) data = await getModuleList(portal.portal.id, filterParse)
    }
    return data.map(moduleToApi)
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw refusal('validation.failed', 400, { message: e.issues.map(i => i.message).join(', '), details: zodFields(e) })
    }
    if (isError(e)) throw e
    throw fault('internal', { cause: e })
  }
})
