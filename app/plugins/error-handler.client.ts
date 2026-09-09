import useErrorStateStore from '~/services/stores/errorStateStore'
import { errorText, normalizeError } from '~/services/errors'
import { isApiErrorBody } from '~~/shared/models/errors'

// Последний рубеж: ошибки, которые не поймал ни один catch.
//
// Полноэкранная модалка предлагает перезагрузить виджет, то есть стоит дорого —
// введённые в форму данные теряются. Поэтому она остаётся только для того, для
// чего и была: когда работать дальше нельзя. Ошибки запросов сюда доходят уже
// показанными в тосте (их показал интерцептор axios), и второй раз тревожить
// пользователя незачем.

export default defineNuxtPlugin((nuxtApp) => {
  const errorStore = useErrorStateStore()

  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    console.error('Vue error:', err, info)
    errorStore.showError(err)
  }

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise:', event.reason)
    // Уже нормализованный ответ сервера — пользователь увидел тост.
    if (isApiErrorBody(event.reason)) return
    errorStore.showError({ message: errorText(normalizeError(event.reason)) })
  })
})
