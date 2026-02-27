import useErrorStateStore from "~/services/stores/errorStateStore"

export default defineNuxtPlugin((nuxtApp) => {
  const errorStore = useErrorStateStore()

  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    console.error('Vue error:', err, info)
    errorStore.showError(err)
  }

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise:', event.reason)
    errorStore.showError(event.reason)
  })
})
