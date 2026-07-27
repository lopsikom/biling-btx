import { prisma } from '~~/server/services/prisma/prismaClient'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import { contractOwnerType } from '~~/server/utils/contractOwnerType'
import { acquireLock, releaseLock } from '~~/server/utils/redis/webHookLocker'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { reconcileContractProducts } from './reconcileContractProducts'

/**
 * Ленивый self-heal модулей с parent_product_id=0 (плейсхолдер миграции 0002, см. CONTEXT.md).
 * Настоящий вид и field_values живут в Bitrix (offer'ы) — восстанавливаем пересинком договора,
 * ровно когда его модули запросили (аналогия инвалидации зеркал метаданных).
 *
 * Триггерится по факту parent_product_id=0 в выдаче module.list. Идёт от договора (reconcile
 * работает от productRows), поэтому чиним договоры, а не отдельные модули. mode='create' —
 * без диффа на удаление и без аудита (backfill, см. CONTEXT.md → events). Лок по договору.
 *
 * @returns true, если хоть один договор перечитан (caller должен перечитать модули из БД).
 */
export async function healZeroKindModules(modules: { parent_product_id: number, contract_id: number | null }[], ctx: PortalDataType): Promise<boolean> {
  const contractIds = [...new Set(modules.filter(m => m.parent_product_id === 0 && m.contract_id).map(m => m.contract_id as number))]
  if (!contractIds.length) return false

  const portal = await getPortal({ id: ctx.portal.id })
  const entityTypeId = portal?.contract_entity_type_id
  if (!entityTypeId) return false

  const token = await getBitrixTokenByRedis(ctx)
  if (!token) return false

  const contracts = await prisma.contract.findMany({
    where: { id: { in: contractIds }, portal_id: ctx.portal.id },
    select: { bitrix_id: true }
  })

  let healed = false
  for (const c of contracts) {
    if (!c.bitrix_id) continue
    try {
      await acquireLock(c.bitrix_id, ctx.portal.id)
      await reconcileContractProducts({
        domain: ctx.portal.domain,
        token: token.access_token,
        contractBitrixId: c.bitrix_id,
        contractStringId: contractOwnerType(entityTypeId),
        portalId: ctx.portal.id,
        mode: 'create'
      })
      healed = true
    } catch (e) {
      console.error(`[heal] не удалось пересинкать договор ${c.bitrix_id}`, e)
    } finally {
      await releaseLock(c.bitrix_id, ctx.portal.id)
    }
  }
  return healed
}
