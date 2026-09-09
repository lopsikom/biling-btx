// Род сообщения: до этого успех и ошибка выглядели одинаково — с зелёной
// галочкой, — и «Не удалось сохранить» читалось как подтверждение (ADR-0009).
export type ToastKind = 'success' | 'error'

const useToastStore = defineStore('toast', () => {
  const open = ref(false)
  const title = ref<string>('')
  const kind = ref<ToastKind>('success')

  const timeOut = ref(0)

  function openToast(text: string, toastKind: ToastKind = 'success') {
    open.value = false
    window.clearTimeout(timeOut.value)
    timeOut.value = window.setTimeout(() => {
      title.value = text
      kind.value = toastKind
      open.value = true
    }, 100)
  }

  // Ошибку показываем тем же механизмом, но с другим оформлением.
  function openErrorToast(text: string) {
    openToast(text, 'error')
  }

  return {
    open,
    title,
    kind,
    timeOut,
    openToast,
    openErrorToast
  }
})

export default useToastStore
