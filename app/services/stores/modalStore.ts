import type { IConnection, IContract } from '~~/shared/models/APIModels'
import type { ModalEnum } from '../models/enums/billing/ModalsEnum'

const useModalStore = defineStore('modal', () => {
  const argsModal = ref<Record<string, unknown>>({})
  const openModal = ref(false)
  const modalID = ref<ModalEnum | null>()
  const openModalHigher = ref(false)
  const modalHigherID = ref<ModalEnum | null>()
  const EditContract = ref<IContract | null>(null)
  const EditConnection = ref<IConnection | null>(null)
  const addContractTariff = ref<{ item: any, selected_contract: {
    label: number
    value: string
  } | undefined } | null>(null)

  function showModal(id: ModalEnum, ...args: { key: string, data: unknown }[]) {
    args.forEach(a => argsModal.value[a.key] = a.data)
    modalID.value = id
    openModal.value = true
  }
  function showHigherModal(id: ModalEnum) {
    modalHigherID.value = id
    openModalHigher.value = true
  }

  function hideModal() {
    argsModal.value = {}
    if (openModalHigher.value) {
      openModalHigher.value = false
      modalHigherID.value = null
    } else {
      openModal.value = false
      modalID.value = null
    }
  }
  return {
    argsModal,
    openModal,
    modalID,
    openModalHigher,
    modalHigherID,
    EditContract,
    addContractTariff,
    EditConnection,
    showModal,
    hideModal,
    showHigherModal
  }
})

export default useModalStore
