import companyClient from '~~/server/services/bitrix/CompanyClient'
import { eventsAudit } from '~~/server/services/EventsAudit'
import type { EventEntity } from '~~/server/services/EventsAudit'
import { getContractById } from '~~/server/utils/prisma/modules/Contract'
import { switchContractProduct, updateProductBitrix } from '~~/server/utils/ProductBitrix'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { IProductCatalogCreate } from '~~/shared/models/bitrixModels'
import type { ProvisionedEntity } from './types'
import type { UpdateModuleSpec } from './updateTypes'

/**
 * Единый сценарий обновления модуля (PATCH). Парный к provisionModule.
 *
 * Стандартный путь (4 из 5 модулей + простая ветка autoinfo): проверка владения →
 * загрузка старой строки → лок по договору → updateProductBitrix → опциональный
 * перенос между договорами (switchContractProduct) → patch в БД → audit → unlock.
 *
 * Нестандартную Bitrix-логику (миграция категории у autoinfo) spec берёт на себя
 * через handleProductUpdate — тогда стандартная Bitrix-часть пропускается.
 *
 * Доменное ядро: не знает про HTTP/event/ZodError. Ошибки пробрасываются наверх.
 */
export async function updateModule<TBody, TPrisma extends Record<string, unknown>, TEntity extends ProvisionedEntity>(
  spec: UpdateModuleSpec<TBody, TPrisma, TEntity>,
  id: number,
  body: TBody,
  ctx: PortalDataType
): Promise<{ entity: TEntity }> {
  const verify = await spec.requireOwn(id, ctx.portal.id)
  if (!verify) throw createError({ statusCode: 404, statusMessage: 'not verify portal' })

  const old = await spec.getOld(id)
  if (!old || !old.bitrix_id || !old.contract_id) {
    throw createError({ statusCode: 404, statusMessage: 'No found module' })
  }

  const contract = await getContractById(old.contract_id)
  if (!contract || !contract.bitrix_id) {
    throw createError({ statusCode: 404, statusMessage: 'No found contract' })
  }

  const prismaData = spec.mapToPrisma(body) as TPrisma & { bitrix_id?: number, product_id?: number, contract?: unknown | null }

  await acquireLock(contract.bitrix_id, ctx.portal.id)
  try {
    const company = new companyClient(ctx.portal.domain, ctx.portal.id, contract.company.bitrix_id)

    if (spec.handleProductUpdate) {
      // Нестандартный сценарий (autoinfo): spec владеет Bitrix-частью целиком.
      const result = await spec.handleProductUpdate({
        company,
        body,
        old: { ...old, bitrix_id: old.bitrix_id, contract_id: old.contract_id },
        ctx,
        contractBitrixId: contract.bitrix_id
      })
      if (result.bitrixIdOverride !== undefined) prismaData.bitrix_id = result.bitrixIdOverride
      if (result.productIdOverride !== undefined) prismaData.product_id = result.productIdOverride
      if (result.dropContract) delete prismaData.contract
    } else {
      // Стандартный путь: обновить товар, опционально перенести на другой договор.
      const catalogProps = spec.buildCatalogProps?.(body)
      await updateProductBitrix<IProductCatalogCreate>(company, {
        rowBody: { row_id: old.bitrix_id, body: { productName: (body as { title?: string }).title, price: (body as { price?: number }).price } },
        catalogBody: catalogProps && old.product_id
          ? { product_id: old.product_id, body: catalogProps as unknown as Partial<IProductCatalogCreate> }
          : undefined
      })

      const newContractId = (body as { contract_id?: number }).contract_id
      if (newContractId) {
        const newContract = await getContractById(newContractId)
        if (newContract && newContract.bitrix_id) {
          await acquireLock(newContract.bitrix_id, ctx.portal.id)
          try {
            const newRow = await switchContractProduct(company, ctx.portal.id, newContract.bitrix_id, old.bitrix_id, spec.productType(old, body))
            if (newRow) prismaData.bitrix_id = newRow.result.productRow.id
            else delete prismaData.contract
          } finally {
            await releaseLock(newContract.bitrix_id, ctx.portal.id)
          }
        }
      }
    }

    const entity = await spec.patch(id, prismaData, body)
    if (!entity) throw createError({ statusCode: 404, statusMessage: 'No found module' })

    eventsAudit.emit('entity.update', {
      userid: ctx.user_id,
      entity: spec.entityType,
      entityName: entity.title,
      companyid: entity.contract?.company_id
    } as EventEntity)

    return { entity }
  } finally {
    await releaseLock(contract.bitrix_id, ctx.portal.id)
  }
}
