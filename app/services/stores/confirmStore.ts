// Стор подтверждения деструктивных действий (удаление модуля, группы и т.п.).
// Открывается через ask(), результат — через колбэк onConfirm.
const useConfirmStore = defineStore('confirm', () => {
  const visible = ref(false)
  const title = ref<string>('Подтвердите действие')
  const message = ref<string>('')
  const confirmText = ref<string>('Удалить')
  let onConfirm: (() => void | Promise<void>) | null = null

  function ask(opts: { message: string, title?: string, confirmText?: string, onConfirm: () => void | Promise<void> }) {
    message.value = opts.message
    title.value = opts.title ?? 'Подтвердите действие'
    confirmText.value = opts.confirmText ?? 'Удалить'
    onConfirm = opts.onConfirm
    visible.value = true
  }

  async function confirm() {
    const cb = onConfirm
    visible.value = false
    onConfirm = null
    if (cb) await cb()
  }

  function cancel() {
    visible.value = false
    onConfirm = null
  }

  return { visible, title, message, confirmText, ask, confirm, cancel }
})

export default useConfirmStore
