import syncService from '~~/server/services/syncService'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'
import { requireRole } from '~~/server/utils/requireRole'
import { fault } from '~~/server/utils/errors'

// Первичный сбор CRM-сущностей портала (компании, контакты, счета, юзеры).
// Вызывается один раз с экрана установки, после того как сохранена привязка
// (смарт-процесс договора + раздел каталога) — см. install.vue.
export default defineEventHandler(async (event) => {
  requireRole(event, 'manager')
  const portalCtx = event.context.portal as PortalDataType
  try {
    const ok = await syncService.installSync(portalCtx.portal.id)
    return ok
  } catch (e) {
    throw fault('internal', { message: 'Не удалось выполнить первичную синхронизацию', cause: e })
  }
})
