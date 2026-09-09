import { getFieldsMirror, toClientFields } from '~~/server/services/fieldMetadata'
import { getBitrixTokenByRedis } from '~~/server/utils/getBitrixToken'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import type { IMetadataResponse } from '~~/shared/models/APIModels'
import { fault, refusal } from '~~/server/utils/errors'

// Зеркало метаданных полей договора для рендера форм (ADR-0003).
// ?refresh=1 — принудительное обновление из Bitrix (кнопка «обновить» в UI).
export default defineEventHandler(async (event): Promise<IMetadataResponse> => {
  const portalCtx = event.context.portal as PortalDataType
  // Привязку читаем из БД, а не из кешированного контекста: она могла смениться в настройках
  const portal = await getPortal({ id: portalCtx.portal.id })
  if (!portal?.contract_entity_type_id) return { configured: false, fields: [] }
  const force = getQuery(event).refresh === '1'
  const token = await getBitrixTokenByRedis(portalCtx)
  if (!token) throw refusal('bitrix.token_expired', 502, { message: 'Приложение потеряло доступ к Bitrix24 — требуется переустановка' })
  try {
    const mirror = await getFieldsMirror({
      portal_id: portal.id,
      entity: 'contract',
      domain: portal.domain,
      token: token.access_token,
      entityTypeId: portal.contract_entity_type_id,
      force: force
    })
    return { configured: true, fields: toClientFields(mirror) }
  } catch (e) {
    throw fault('bitrix.api_error', { statusCode: 502, message: 'Не удалось получить описания полей из Bitrix' })
  }
})
