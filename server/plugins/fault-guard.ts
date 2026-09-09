import { journalPath, recordFault } from '../utils/errorJournal'

// Сбои, случившиеся вне HTTP-запроса: их не увидит обработчик ошибок /api/**.
// Главный источник — async-листенеры вебхуков (emitBitrixEvent вызывается без
// await, ответ Bitrix уже отдан) и фоновый sync.

export default defineNitroPlugin(() => {
  console.log(`[журнал ошибок] сбои пишутся в ${journalPath()}`)

  // Необработанный reject в фоновом листенере по умолчанию роняет весь процесс
  // (Node 15+). Здесь это осознанно перехватывается: один кривой вебхук не
  // должен уносить сервер вместе со всеми порталами. Сбой попадает в журнал.
  process.on('unhandledRejection', (reason) => {
    recordFault(reason, 'internal', 500, {
      source: 'process',
      extra: { hook: 'unhandledRejection' }
    })
  })

  // uncaughtExceptionMonitor, а не uncaughtException: он только наблюдает и не
  // мешает процессу упасть. Продолжать работу после uncaughtException нельзя —
  // состояние процесса уже неопределённое.
  process.on('uncaughtExceptionMonitor', (error) => {
    recordFault(error, 'internal', 500, {
      source: 'process',
      extra: { hook: 'uncaughtException', fatal: true },
      flush: true
    })
  })
})
