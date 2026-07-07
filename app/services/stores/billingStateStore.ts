import type { IContract, IFieldMeta, IModule, IModuleKind, IConnection, IConnectionStatus, IConnectionType, IUser } from '~~/shared/models/APIModels'

const usebillingStateStore = defineStore('billingState', () => {
  const contracts = ref<IContract[]>([])
  const contractsTariff = ref<IContract[]>([])
  // Модули на динамических полях (ADR-0004): единый список вместо пяти видов
  const modules = ref<IModule[]>([])
  // Зеркало метаданных: поля договора + виды/поля модулей (каталог)
  const contractFields = ref<IFieldMeta[]>([])
  const metadataConfigured = ref<boolean>(true)
  const moduleKinds = ref<IModuleKind[]>([])
  const moduleFieldsByKind = ref<Record<number, IFieldMeta[]>>({})
  const moduleMetadataConfigured = ref<boolean>(true)
  const connections = ref<IConnection[]>([])
  const connection_statuses = ref<IConnectionStatus[]>([])
  const connection_types = ref<IConnectionType[]>([])
  const companyUsers = ref<IUser[]>([])

  const isRefreshContracts = ref<boolean>(false)
  const isRefreshModules = ref<boolean>(false)

  return {
    contracts,
    contractsTariff,
    modules,
    isRefreshContracts,
    isRefreshModules,
    contractFields,
    metadataConfigured,
    moduleKinds,
    moduleFieldsByKind,
    moduleMetadataConfigured,
    connections,
    connection_statuses,
    connection_types,
    companyUsers
  }
})

export default usebillingStateStore
