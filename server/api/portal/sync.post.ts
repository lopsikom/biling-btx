import syncService from '~~/server/services/syncService'
import type { PortalDataType } from '~~/server/utils/prisma/getPortalByUserBitrix'

// Первичный сбор CRM-сущностей портала (компании, контакты, счета, юзеры).
// Вызывается один раз с экрана установки, после того как сохранена привязка
// (смарт-процесс договора + раздел каталога) — см. install.vue.
export default defineEventHandler(async (event) => {
  const portalCtx = event.context.portal as PortalDataType
  try {
    const ok = await syncService.installSync(portalCtx.portal.id)
    return ok
  } catch (e) {
    console.error(e)
    throw createError({ statusCode: 500, statusMessage: 'Server Error', message: 'Не удалось выполнить первичную синхронизацию' })
  }
})
