import companyClient from '~~/server/services/bitrix/CompanyClient'
import { eventsAudit } from '~~/server/services/EventsAudit'
import type { EventEntity } from '~~/server/services/EventsAudit'
import { getShapshotProduct, saveShapshotProduct } from '~~/server/services/webHooksEvents'
import { getContractById } from '~~/server/utils/prisma/modules/Contract'
import { setProductBitrix } from '~~/server/utils/ProductBitrix'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { productRecords, type IProductCatalogCreate } from '~~/shared/models/bitrixModels'
import type { ModuleSpec, ProvisionedEntity } from './types'

export interface ProvisionResult<TEntity, TExtra> {
  entity: TEntity
  extra: TExtra
}

/**
 * Единый сценарий добавления модуля (module provisioning, см. CONTEXT.md).
 *
 * Bitrix-first без отката (ADR-0002): сначала product в Bitrix, затем строка в БД.
 * Весь транзакционный инвариант — лок по договору вокруг записи в Bitrix и БД,
 * обновление snapshot и аудит — живёт здесь, один раз для всех видов модулей.
 *
 * Доменное ядро: не знает про HTTP/event/ZodError — парсинг тела и маппинг ошибок
 * в статус-коды лежат в defineModuleHandler. Ошибки пробрасываются наверх.
 */
export async function provisionModule<TBody, TPrisma, TEntity extends ProvisionedEntity, TExtra>(
  spec: ModuleSpec<TBody, TPrisma, TEntity, TExtra>,
  body: TBody,
  ctx: PortalDataType
): Promise<ProvisionResult<TEntity, TExtra>> {
  const contractId = (body as { contract_id: number }).contract_id
  const found = await getContractById(contractId)
  if (!found || !found.bitrix_id) {
    throw createError({ statusCode: 404, statusMessage: 'No found contract' })
  }

  await acquireLock(found.bitrix_id, ctx.portal.id)
  try {
    const company = new companyClient(ctx.portal.domain, ctx.portal.id, found.company.bitrix_id)
    const productType = spec.resolveProductType(body)
    const catalogProps = spec.buildCatalogProps?.(body) ?? {}

    const product = await setProductBitrix<IProductCatalogCreate>(
      company,
      {
        contract_id: found.bitrix_id,
        data: {
          price: (body as { price: number }).price,
          productName: (body as { title: string }).title
        }
      },
      {
        parent_id: productRecords[productType].id,
        data: {
          name: productType,
          active: (body as { active: boolean }).active ? 'Y' : 'N',
          ...catalogProps
        } as unknown as IProductCatalogCreate
      }
    )

    // Достройка общих для всех модулей полей результатом из Bitrix (см. план, реш. №4).
    const prismaBody = spec.mapToPrisma(body) as TPrisma & {
      bitrix_id?: number
      product_id?: number
      portal?: { connect: { id: number } }
    }
    prismaBody.bitrix_id = product.productRow.result.productRow.id
    prismaBody.product_id = product.productCatalog.result.offer.id
    prismaBody.portal = { connect: { id: ctx.portal.id } }

    const entity = await spec.post(prismaBody)
    const extra = (spec.afterPersist
      ? await spec.afterPersist(entity, body)
      : undefined) as TExtra

    const snapshot = await getShapshotProduct(found.bitrix_id, ctx.portal.id)
    await saveShapshotProduct(found.bitrix_id, ctx.portal.id, [
      ...snapshot,
      {
        bitrix_id: product.productRow.result.productRow.id,
        portal_id: ctx.portal.id,
        type: productType
      }
    ])

    eventsAudit.emit('entity.create', {
      userid: ctx.user_id,
      entity: spec.entityType,
      entityName: entity.title,
      companyid: entity.contract?.company_id
    } as EventEntity)

    return { entity, extra }
  } finally {
    await releaseLock(found.bitrix_id, ctx.portal.id)
  }
}
