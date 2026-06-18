import { autoinformationInputMapPrisma } from '~~/server/utils/mappers'
import { getAutoinformationByIdPrisma, patchAutoinfromationPrisma, requireAutoInfo } from '~~/server/utils/prisma/modules/AutoInfo'
import { autoinformationProductTypeByTypeId, autoinformationPropsForCatalog } from '~~/server/utils/bitrixProductProps'
import { switchContractProduct, switchProductCategory, updateProductBitrix } from '~~/server/utils/ProductBitrix'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import { getContractById } from '~~/server/utils/prisma/modules/Contract'
import { AutoInformationFilterUpdate, entityType, type IAutoinformationFilterUpdate } from '~~/shared/models/APIModels'
import { type IProductCatalogCreate, productRecords } from '~~/shared/models/bitrixModels'
import type { autoinformation_moduleUpdateInput } from '~~/server/services/models/generated/prisma/models'
import type { UpdateModuleSpec } from '../updateTypes'

type Entity = NonNullable<Awaited<ReturnType<typeof patchAutoinfromationPrisma>>>

/**
 * autoinformation — особый случай: смена type_id может менять КАТЕГОРИЮ продукта Bitrix
 * (обзвон ↔ SMS). Тогда вместо обычного update нужен switchProductCategory
 * (удалить старый row+offer, создать новые в другой категории). Эта логика не повторяется
 * нигде, поэтому инкапсулирована здесь, в handleProductUpdate, и не протекает в движок.
 */
export const autoinfoUpdateSpec: UpdateModuleSpec<IAutoinformationFilterUpdate, autoinformation_moduleUpdateInput, Entity> = {
  updateSchema: AutoInformationFilterUpdate,
  mapToPrisma: b => autoinformationInputMapPrisma(b),
  productType: old => autoinformationProductTypeByTypeId((old as { type_id?: number }).type_id ?? 1),
  requireOwn: requireAutoInfo,
  getOld: getAutoinformationByIdPrisma,
  patch: (id, data) => patchAutoinfromationPrisma(id, data),
  entityType: entityType.AUTOINFORMATION,

  handleProductUpdate: async ({ company, body, old, ctx, contractBitrixId }) => {
    const o = old as typeof old & { type_id?: number, active?: boolean | null, title?: string, price?: number, product_id: number | null }
    const oldType = o.type_id ?? 1
    const newType = body.type_id ?? oldType
    const oldCategory = autoinformationProductTypeByTypeId(oldType)
    const newCategory = autoinformationProductTypeByTypeId(newType)
    const isCategoryMigration = oldCategory !== newCategory

    if (isCategoryMigration) {
      let targetContractBitrixId = contractBitrixId
      let needSecondLock = false
      if (body.contract_id && body.contract_id !== old.contract_id) {
        const newContract = await getContractById(body.contract_id)
        if (newContract && newContract.bitrix_id) {
          targetContractBitrixId = newContract.bitrix_id
          needSecondLock = true
          await acquireLock(newContract.bitrix_id, ctx.portal.id)
        }
      }
      try {
        const finalActive = body.active !== undefined ? (body.active ? 'Y' : 'N') : (o.active ? 'Y' : 'N')
        const finalTitle = body.title ?? o.title ?? ''
        const finalPrice = body.price ?? o.price ?? 0
        const newCatalogProps = autoinformationPropsForCatalog(newType) ?? {}
        const result = await switchProductCategory<IProductCatalogCreate>(
          company,
          ctx.portal.id,
          contractBitrixId,
          targetContractBitrixId,
          old.bitrix_id,
          o.product_id!,
          { parent_id: productRecords[newCategory].id, data: { name: newCategory, active: finalActive, ...newCatalogProps } as unknown as IProductCatalogCreate },
          { productName: finalTitle, price: finalPrice },
          newCategory
        )
        return {
          bitrixIdOverride: result.productRow.result.productRow.id,
          productIdOverride: result.productCatalog.result.offer.id
        }
      } finally {
        if (needSecondLock) await releaseLock(targetContractBitrixId, ctx.portal.id)
      }
    }

    // Не миграция категории — обычный update + опциональный перенос на другой договор.
    const catalogProps = autoinformationPropsForCatalog(body.type_id)
    await updateProductBitrix<IProductCatalogCreate>(company, {
      rowBody: { row_id: old.bitrix_id, body: { productName: body.title, price: body.price } },
      catalogBody: catalogProps && o.product_id
        ? { product_id: o.product_id, body: catalogProps as unknown as Partial<IProductCatalogCreate> }
        : undefined
    })
    if (body.contract_id) {
      const newContract = await getContractById(body.contract_id)
      if (newContract && newContract.bitrix_id) {
        await acquireLock(newContract.bitrix_id, ctx.portal.id)
        try {
          const newRow = await switchContractProduct(company, ctx.portal.id, newContract.bitrix_id, old.bitrix_id, oldCategory)
          if (newRow) return { bitrixIdOverride: newRow.result.productRow.id }
          return { dropContract: true }
        } finally {
          await releaseLock(newContract.bitrix_id, ctx.portal.id)
        }
      }
    }
    return {}
  }
}
