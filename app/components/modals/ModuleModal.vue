<script setup lang="ts">
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import useModalStore from '~/services/stores/modalStore'
import useToastStore from '~/services/stores/toastStore'
import useMenuStore from '~/services/stores/menuStores'
import useConfirmStore from '~/services/stores/confirmStore'
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum'
import type { SelectorObject } from '~/services/models'
import type { IModule, IModulePost, IModuleUpdate, IFieldMeta } from '~~/shared/models/APIModels'

// Generic-модалка модулей (ADR-0004/0006): список модулей + добавление по видам каталога.
// Форма вида рендерится DynamicField по метаданным каталога — как договор в этапе 1.
const billingStateStore = usebillingStateStore()
const modalStore = useModalStore()
const toastStore = useToastStore()
const menuStore = useMenuStore()
const confirmStore = useConfirmStore()
const { $axios } = useNuxtApp()

// Договоры для привязки (selector) — по имени
const contractItems = computed<SelectorObject[]>(() => billingStateStore.contractsTariff.map(c => ({ label: c.id, value: c.name })))
const kindItems = computed<SelectorObject[]>(() => billingStateStore.moduleKinds.map(k => ({ label: k.parent_product_id, value: k.name })))

const mode = ref<'list' | 'add' | 'edit'>('list')
// В режиме edit — редактируемый модуль (вид менять нельзя, offer привязан к виду)
const editing = ref<IModule>()

// Форма модуля (общая для add/edit)
const selectedContract = ref<SelectorObject>()
const selectedKind = ref<SelectorObject>()
const title = ref<string>('')
const price = ref<number>(0)
const quantity = ref<number>(1)
const active = ref<boolean>(true)
const values = ref<Record<string, unknown>>({})

// Вид, поля которого редактируем (add — выбранный, edit — вид модуля).
const currentKindId = computed(() => mode.value === 'edit' ? editing.value?.parent_product_id : (selectedKind.value ? Number(selectedKind.value.label) : undefined))

// Поля выбранного вида — из метаданных каталога.
const kindFields = computed(() => {
  if (currentKindId.value === undefined) return []
  return billingStateStore.moduleFieldsByKind[currentKindId.value] ?? []
})

// Мультиселект-группы вида (field group): часть boolean-полей схлопнута в группы.
const kindGroups = computed(() => currentKindId.value !== undefined ? (billingStateStore.moduleGroupsByKind[currentKindId.value] ?? []) : [])
// Коды полей, входящих в любую группу — их не рендерим по отдельности
const groupedCodes = computed(() => new Set(kindGroups.value.flatMap(g => g.fields)))
// Поля вне групп — рендерятся обычным DynamicField
const ungroupedFields = computed(() => kindFields.value.filter(f => !groupedCodes.value.has(f.code)))

// IFieldMeta[] полей группы (по кодам) — для MultiSelectGroup
function groupFields(codes: string[]): IFieldMeta[] {
  return codes
    .map(code => kindFields.value.find(f => f.code === code))
    .filter((f): f is IFieldMeta => !!f)
}

watch(selectedKind, (k) => {
  // Сброс значений при смене вида — только при создании (в edit вид фиксирован)
  if (mode.value !== 'add') return
  values.value = {}
  if (k && !title.value) title.value = String(k.value)
})

// Кнопка «+»: создать новый договор поверх (высшая модалка). AddContract кладёт
// созданный договор в contractsTariff и в addContractTariff.selected_contract —
// подхватываем его как выбранный.
function openAddContract() {
  modalStore.addContractTariff = { item: null, selected_contract: undefined }
  modalStore.showHigherModal(ModalEnum.ADD_CONTRACT)
}
watch(() => modalStore.addContractTariff?.selected_contract, (sel) => {
  if (sel) selectedContract.value = sel
})

onBeforeMount(async () => {
  if (!billingStateStore.contractsTariff.length) {
    billingStateStore.contractsTariff = await $axios.getContracts({})
  }
})

const modulesList = computed(() => billingStateStore.modules)
function kindName(pid: number) {
  return billingStateStore.moduleKinds.find(k => k.parent_product_id === pid)?.name ?? `Товар ${pid}`
}

// Список модулей, сгруппированный по категории-папке каталога (как в старом окне).
const modulesByCategory = computed(() => {
  const kindOf = (pid: number) => billingStateStore.moduleKinds.find(k => k.parent_product_id === pid)
  const groups = new Map<string, IModule[]>()
  for (const m of modulesList.value) {
    const kind = kindOf(m.parent_product_id)
    const cat = kind?.category_name ?? kind?.name ?? `Товар ${m.parent_product_id}`
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(m)
  }
  return [...groups.entries()].map(([category, modules]) => ({ category, modules }))
})

function isEmpty(v: unknown) {
  return v === undefined || v === null || String(v).trim() === ''
}

async function saveModule() {
  menuStore.fetchDataLoad = true
  try {
    if (!selectedContract.value || !selectedKind.value || isEmpty(title.value)) throw new Error('Validation Error')
    const data: IModulePost = {
      contract_id: Number(selectedContract.value.label),
      parent_product_id: Number(selectedKind.value.label),
      title: title.value,
      price: Number(price.value) || 0,
      quantity: Number(quantity.value) || 1,
      active: active.value,
      values: { ...values.value }
    }
    const module = await $axios.postModule(data)
    billingStateStore.modules.unshift(module)
    toastStore.openToast('Модуль добавлен')
    resetForm()
    mode.value = 'list'
  } catch (e) {
    console.error(e)
    if ((e as Error).message === 'Validation Error') toastStore.openToast('Заполните договор, вид и название')
    else toastStore.openToast('Не удалось добавить модуль')
  } finally { menuStore.fetchDataLoad = false }
}

// Открыть форму редактирования: предзаполнить из модуля, вид зафиксировать
function openEdit(module: IModule) {
  editing.value = module
  selectedContract.value = contractItems.value.find(c => Number(c.label) === module.contract_id)
  selectedKind.value = kindItems.value.find(k => Number(k.label) === module.parent_product_id)
  title.value = module.title
  price.value = module.price
  quantity.value = module.quantity
  active.value = module.active
  values.value = { ...(module.values ?? {}) }
  mode.value = 'edit'
}

async function saveEdit() {
  if (!editing.value) return
  menuStore.fetchDataLoad = true
  try {
    if (!selectedContract.value || isEmpty(title.value)) throw new Error('Validation Error')
    const data: IModuleUpdate = {
      contract_id: Number(selectedContract.value.label),
      title: title.value,
      price: Number(price.value) || 0,
      quantity: Number(quantity.value) || 1,
      active: active.value,
      values: { ...values.value }
    }
    const updated = await $axios.patchModule(editing.value.id, data)
    const idx = billingStateStore.modules.findIndex(m => m.id === updated.id)
    if (idx > -1) billingStateStore.modules[idx] = updated
    toastStore.openToast('Модуль обновлён')
    resetForm()
    mode.value = 'list'
  } catch (e) {
    console.error(e)
    if ((e as Error).message === 'Validation Error') toastStore.openToast('Заполните договор и название')
    else toastStore.openToast('Не удалось обновить модуль')
  } finally { menuStore.fetchDataLoad = false }
}

function removeModule(module: IModule) {
  confirmStore.ask({
    title: 'Удалить модуль?',
    message: `Модуль «${module.title}» будет удалён из договора и из Bitrix. Действие необратимо.`,
    onConfirm: () => doRemoveModule(module)
  })
}

async function doRemoveModule(module: IModule) {
  menuStore.fetchDataLoad = true
  try {
    const ok = await $axios.deleteModule(module.id)
    if (ok) {
      billingStateStore.modules = billingStateStore.modules.filter(m => m.id !== module.id)
      toastStore.openToast('Модуль удалён')
    } else toastStore.openToast('Не удалось удалить модуль')
  } catch (e) {
    console.error(e)
    toastStore.openToast('Не удалось удалить модуль')
  } finally { menuStore.fetchDataLoad = false }
}

function resetForm() {
  editing.value = undefined
  selectedContract.value = undefined
  selectedKind.value = undefined
  title.value = ''
  price.value = 0
  quantity.value = 1
  active.value = true
  values.value = {}
}
</script>

<template>
  <div class="flex mb-[25px]">
    <div class="flex flex-col">
      <span class="text-lg font-semibold select-none">Модули</span>
      <span class="text-gray-500 text-sm select-none">биллинговые услуги договоров</span>
    </div>
    <div
      style="margin-left: auto; margin-top: 5px;"
      @click="modalStore.hideModal"
    >
      <Icon icon="maki:cross" />
    </div>
  </div>

  <div
    v-if="!billingStateStore.moduleMetadataConfigured"
    class="text-gray-500 text-sm select-none py-6"
  >
    Виды модулей не настроены: отметьте товары каталога как биллинговые на странице «Поля».
  </div>

  <template v-else>
    <!-- Список модулей -->
    <div
      v-if="mode === 'list'"
      class="assign-modal"
    >
      <div class="flex">
        <div
          class="add-btn items-center flex px-3 py-2 gap-1"
          style="margin-left: auto;"
          @click="mode = 'add'"
        >
          <Icon
            icon="mdi:plus"
            class="w-5 h-5 text-slate-50"
          />
          <span class="select-none text-sm text-slate-50 font-semibold">Добавить модуль</span>
        </div>
      </div>
      <div
        class="any-white-container p-4 flex flex-col gap-2"
        style="width: 100%;"
      >
        <div
          v-if="!modulesList.length"
          class="text-gray-500 text-sm select-none py-4 text-center"
        >
          Модулей нет
        </div>
        <!-- Группировка по категории-папке каталога -->
        <div
          v-for="group in modulesByCategory"
          :key="group.category"
          class="flex flex-col gap-1"
        >
          <span class="text-gray-500 text-xs font-semibold uppercase select-none mt-2">{{ group.category }}</span>
          <div
            v-for="m in group.modules"
            :key="m.id"
            class="module-row flex items-center gap-3 py-2"
          >
            <div
              class="flex flex-col"
              style="flex: 1;"
            >
              <span class="font-semibold text-sm">{{ m.title }}</span>
              <span class="text-gray-500 text-xs">{{ kindName(m.parent_product_id) }} · {{ m.price }} ₽ · {{ m.quantity }} шт</span>
            </div>
            <div
              :class="m.active ? 'any-green-container' : 'any-red-container'"
              class="flex gap-1 py-0.5 px-1.5 items-center"
              style="height: fit-content;"
            >
              <span class="text-xs">{{ m.active ? 'Активен' : 'Отключён' }}</span>
            </div>
            <Icon
              icon="mdi:pencil-outline"
              class="w-5 h-5 text-sky-600 cursor-pointer"
              @click="openEdit(m)"
            />
            <Icon
              icon="mdi:trash-can-outline"
              class="w-5 h-5 text-red-500 cursor-pointer"
              @click="removeModule(m)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Добавление / редактирование модуля -->
    <div
      v-else
      class="assign-modal"
    >
      <div
        class="any-white-container p-5 gap-3 flex flex-col"
        style="width: 100%;"
      >
        <div class="flex gap-[10px]">
          <InputBox
            v-model="title"
            placeholder="Название..."
            :resize="false"
            title="Название"
            :required="true"
            style="width: 80%;"
          />
          <div class="flex items-center gap-3 mt-5">
            <CheckboxRoot
              v-model="active"
              :class="active ? 'checkbox-active' : 'checkbox-disable'"
            >
              <CheckboxIndicator>
                <Icon
                  icon="radix-icons:check"
                  style="color: white;"
                />
              </CheckboxIndicator>
            </CheckboxRoot>
            <span class="select-none font-semibold text-sm">Активен</span>
          </div>
        </div>
        <div class="flex gap-[10px] items-end">
          <Selector
            v-model="selectedContract"
            style="width: 100%;"
            title="Договор"
            :required="true"
            :items="contractItems"
          />
          <div
            class="add-contract-btn blue-hover flex justify-center items-center"
            title="Создать договор"
            @click="openAddContract()"
          >
            <Icon
              icon="rivet-icons:plus"
              class="w-4 h-4 hover-item"
            />
          </div>
        </div>
        <div class="flex gap-[10px]">
          <InputBox
            v-model="price"
            type="number"
            :resize="false"
            title="Цена, ₽"
            style="width: 25%;"
          />
          <InputBox
            v-model="quantity"
            type="number"
            :resize="false"
            title="Количество"
            style="width: 25%;"
          />
                    <Selector
            v-if="mode === 'add'"
            v-model="selectedKind"
            style="width: 45%;"
            title="Вид модуля"
            :required="true"
            :items="kindItems"
          />
          <div
            v-else
            class="flex flex-col gap-[5px]"
            style="width: 45%;"
          >
            <span class="select-none font-semibold text-sm">Вид модуля</span>
            <div class="kind-locked text-sm flex items-center px-3">
              {{ selectedKind?.value ?? kindName(editing?.parent_product_id ?? 0) }}
            </div>
          </div>
        </div>
        <div
          v-if="ungroupedFields.length"
          class="fields-grid"
        >
          <DynamicField
            v-for="field in ungroupedFields"
            :key="field.code"
            v-model="values[field.code]"
            :field="field"
          />
        </div>
        <!-- Мультиселект-группы: flag-поля объединены в один селектор (старый дизайн) -->
        <div
          v-if="kindGroups.length"
          class="fields-grid"
        >
          <MultiSelectGroup
            v-for="group in kindGroups"
            :key="group.name"
            v-model="values"
            :title="group.name"
            :fields="groupFields(group.fields)"
          />
        </div>
      </div>
      <div
        class="flex mt-[20px] gap-[15px]"
        style="margin-left: auto; flex-direction: row-reverse;"
      >
        <div
          class="save-btn justify-center items-center px-[12px] py-[8px]"
          @click="mode === 'edit' ? saveEdit() : saveModule()"
        >
          <p
            class="select-none text-sm"
            style="color: white;"
          >
            Сохранить
          </p>
        </div>
        <div
          class="close-btn blue-hover justify-center items-center px-[12px] py-[8px]"
          @click="mode = 'list'; resetForm()"
        >
          <p class="select-none text-sm">
            Назад
          </p>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
@import '~/assets/css/any-container.css';
.assign-modal{ display: flex; flex-direction: column; gap: 15px; width: 100%; }
.module-row{ border-top: 1px solid #edf2f7; }
.module-row:first-child{ border-top: 0; }
.fields-grid{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 10px; }
.kind-locked{ height: 38px; background-color: #edf2f7; border-radius: 5px; color: #64748b; }
.add-contract-btn{ height: 38px; min-width: 38px; border: 1.5px solid #e7eaee; border-radius: 5px; cursor: pointer; }
.blue-hover:hover .hover-item{ color: #437db4; transition: color 0.15s ease; }
.save-btn{ background: #3182ce; border-radius: 5px; cursor: pointer; }
.save-btn:hover{ background: #5899d7; transition: background 0.15s ease; }
.add-btn{ background: #3182ce; border-radius: 8px; cursor: pointer; }
.add-btn:hover{ background: #5899d7; transition: background 0.15s ease; }
.close-btn{ border-color: #e7eaee; border-width: 1.5px; border-radius: 5px; cursor: pointer; }
.blue-hover:hover{ background-color: #ebf8ff; transition: background-color 0.15s ease; }
.checkbox-disable{ background-color: #edf2f7; border: 1px solid #e7eaee; border-radius: 5px; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; }
.checkbox-active{ background-color: #3182ce; border: 1px solid #e7eaee; border-radius: 5px; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; }
</style>
