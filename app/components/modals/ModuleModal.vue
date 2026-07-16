<script setup lang="ts">
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import useModalStore from '~/services/stores/modalStore'
import useToastStore from '~/services/stores/toastStore'
import useMenuStore from '~/services/stores/menuStores'
import useConfirmStore from '~/services/stores/confirmStore'
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum'
import type { SelectorObject } from '~/services/models'
import type { IModule, IModulePost, IModuleUpdate, IFieldMeta, IModuleKind } from '~~/shared/models/APIModels'

// Модалка модулей (ADR-0004/0006), аккордеон-дизайн: категории-папки каталога →
// модули внутри → инлайн-редактор полей (DynamicField/группы). «Добавить проект» —
// черновик с выбором вида из категории.
const billingStateStore = usebillingStateStore()
const bitrixStateStore = useBitrixStateStore()
const modalStore = useModalStore()
const toastStore = useToastStore()
const menuStore = useMenuStore()
const confirmStore = useConfirmStore()
const { $axios } = useNuxtApp()

const contractItems = computed<SelectorObject[]>(() => billingStateStore.contractsTariff.map(c => ({ label: c.id, value: c.name })))

onBeforeMount(async () => {
  if (!billingStateStore.contractsTariff.length) {
    billingStateStore.contractsTariff = await $axios.getContracts({})
  }
})

// --- Категории (папки) с видами и модулями ---
interface Category { name: string, kinds: IModuleKind[], kindIds: Set<number>, modules: IModule[] }
const categories = computed<Category[]>(() => {
  const map = new Map<string, Category>()
  for (const k of billingStateStore.moduleKinds) {
    const cat = k.category_name ?? k.name
    if (!map.has(cat)) map.set(cat, { name: cat, kinds: [], kindIds: new Set(), modules: [] })
    const c = map.get(cat)!
    c.kinds.push(k)
    c.kindIds.add(k.parent_product_id)
  }
  for (const m of billingStateStore.modules) {
    for (const c of map.values()) if (c.kindIds.has(m.parent_product_id)) { c.modules.push(m); break }
  }
  return [...map.values()]
})

// --- Раскрытие категорий ---
const openCats = ref<Set<string>>(new Set())
function toggleCat(name: string) {
  if (openCats.value.has(name)) openCats.value.delete(name)
  else openCats.value.add(name)
  openCats.value = new Set(openCats.value)
}

// Открытие из плитки «Подключённые модули»: раскрыть переданную категорию.
onMounted(() => {
  const cat = modalStore.argsModal.category as string | undefined
  if (cat) openCats.value = new Set([cat])
})

// --- Поля/группы вида ---
function fieldsFor(pid: number): IFieldMeta[] {
  return billingStateStore.moduleFieldsByKind[pid] ?? []
}
function groupsFor(pid: number) {
  return billingStateStore.moduleGroupsByKind[pid] ?? []
}
// Видимость (field visibility) ортогональна группам: скрытые коды вычитаются
// и из одиночных полей, и из состава каждой группы (см. CONTEXT.md).
function hiddenFor(pid: number): Set<string> {
  return new Set(billingStateStore.moduleHiddenByKind[pid] ?? [])
}
function ungroupedFor(pid: number): IFieldMeta[] {
  const grouped = new Set(groupsFor(pid).flatMap(g => g.fields))
  const hidden = hiddenFor(pid)
  return fieldsFor(pid).filter(f => !grouped.has(f.code) && !hidden.has(f.code))
}
function groupFieldsFor(pid: number, codes: string[]): IFieldMeta[] {
  const hidden = hiddenFor(pid)
  return codes.filter(c => !hidden.has(c)).map(c => fieldsFor(pid).find(f => f.code === c)).filter((f): f is IFieldMeta => !!f)
}
// Группа, у которой скрыты все поля, не рендерится
function visibleGroupsFor(pid: number) {
  return groupsFor(pid).filter(g => groupFieldsFor(pid, g.fields).length)
}

// --- Инлайн-редактор существующих модулей (буфер по id) ---
interface Buffer { title: string, price: number, quantity: number, values: Record<string, unknown>, contract?: SelectorObject }
const buffers = ref<Record<number, Buffer>>({})
const menuOpen = ref<Record<number, boolean>>({})

// Геттер буфера (не-undefined для шаблона под noUncheckedIndexedAccess). Использовать
// только под v-if="buffers[m.id]" — иначе вернёт undefined.
function buf(id: number): Buffer {
  return buffers.value[id] as Buffer
}

function toggleModule(m: IModule) {
  if (buffers.value[m.id]) { delete buffers.value[m.id]; buffers.value = { ...buffers.value }; return }
  buffers.value = {
    ...buffers.value,
    [m.id]: {
      title: m.title,
      price: m.price,
      quantity: m.quantity,
      values: { ...(m.values ?? {}) },
      contract: contractItems.value.find(c => Number(c.label) === m.contract_id)
    }
  }
}

function storeReplace(updated: IModule) {
  const idx = billingStateStore.modules.findIndex(x => x.id === updated.id)
  if (idx > -1) billingStateStore.modules[idx] = updated
}

async function toggleActive(m: IModule) {
  menuStore.fetchDataLoad = true
  try {
    const updated = await $axios.patchModule(m.id, { active: !m.active })
    storeReplace(updated)
  } catch (e) {
    console.error(e); toastStore.openToast('Не удалось изменить статус')
  } finally { menuStore.fetchDataLoad = false }
}

async function saveModule(m: IModule) {
  const buf = buffers.value[m.id]
  if (!buf) return
  if (!buf.contract || !buf.title.trim()) { toastStore.openToast('Заполните договор и название'); return }
  menuStore.fetchDataLoad = true
  try {
    const data: IModuleUpdate = {
      contract_id: Number(buf.contract.label),
      title: buf.title.trim(),
      price: Number(buf.price) || 0,
      quantity: Number(buf.quantity) || 1,
      values: { ...buf.values }
    }
    const updated = await $axios.patchModule(m.id, data)
    storeReplace(updated)
    delete buffers.value[m.id]; buffers.value = { ...buffers.value }
    toastStore.openToast('Модуль обновлён')
  } catch (e) {
    console.error(e); toastStore.openToast('Не удалось обновить модуль')
  } finally { menuStore.fetchDataLoad = false }
}

function removeModule(m: IModule) {
  menuOpen.value[m.id] = false
  confirmStore.ask({
    title: 'Удалить модуль?',
    message: `Модуль «${m.title}» будет удалён из договора и из Bitrix. Действие необратимо.`,
    onConfirm: () => doRemoveModule(m)
  })
}
async function doRemoveModule(m: IModule) {
  menuStore.fetchDataLoad = true
  try {
    const ok = await $axios.deleteModule(m.id)
    if (ok) {
      billingStateStore.modules = billingStateStore.modules.filter(x => x.id !== m.id)
      toastStore.openToast('Модуль удалён')
    } else toastStore.openToast('Не удалось удалить модуль')
  } catch (e) {
    console.error(e); toastStore.openToast('Не удалось удалить модуль')
  } finally { menuStore.fetchDataLoad = false }
}

// --- Черновики новых модулей (по категории) ---
interface Draft { kind?: SelectorObject, title: string, price: number, quantity: number, values: Record<string, unknown>, contract?: SelectorObject }
const drafts = ref<Record<string, Draft[]>>({})

function draftsFor(cat: string): Draft[] {
  return drafts.value[cat] ?? []
}

function kindItemsFor(cat: Category): SelectorObject[] {
  return cat.kinds.map(k => ({ label: k.parent_product_id, value: k.name }))
}

function addDraft(cat: Category) {
  const only = cat.kinds.length === 1 ? cat.kinds[0] : undefined
  const list = drafts.value[cat.name] ?? []
  list.push({
    kind: only ? { label: only.parent_product_id, value: only.name } : undefined,
    title: only ? only.name : '',
    price: 0, quantity: 1, values: {}, contract: undefined
  })
  drafts.value = { ...drafts.value, [cat.name]: list }
  if (!openCats.value.has(cat.name)) toggleCat(cat.name)
}

function removeDraft(cat: string, i: number) {
  const list = drafts.value[cat]
  if (!list) return
  list.splice(i, 1)
  drafts.value = { ...drafts.value }
}

function onDraftKind(d: Draft) {
  d.values = {}
  if (d.kind && !d.title.trim()) d.title = String(d.kind.value)
}

async function saveDraft(cat: string, i: number) {
  const d = drafts.value[cat]?.[i]
  if (!d) return
  if (!d.contract || !d.kind || !d.title.trim()) { toastStore.openToast('Заполните договор, вид и название'); return }
  menuStore.fetchDataLoad = true
  try {
    const data: IModulePost = {
      contract_id: Number(d.contract.label),
      parent_product_id: Number(d.kind.label),
      title: d.title.trim(),
      price: Number(d.price) || 0,
      quantity: Number(d.quantity) || 1,
      active: true,
      values: { ...d.values }
    }
    const created = await $axios.postModule(data)
    billingStateStore.modules.unshift(created)
    removeDraft(cat, i)
    toastStore.openToast('Модуль добавлен')
  } catch (e) {
    console.error(e); toastStore.openToast('Не удалось добавить модуль')
  } finally { menuStore.fetchDataLoad = false }
}

// --- Создание договора поверх (высшая модалка), подхват в нужный буфер/черновик ---
let contractTarget: ((sel: SelectorObject) => void) | null = null
function openAddContract(setter: (sel: SelectorObject) => void) {
  contractTarget = setter
  modalStore.addContractTariff = { item: null, selected_contract: undefined }
  modalStore.showHigherModal(ModalEnum.ADD_CONTRACT)
}
watch(() => modalStore.addContractTariff?.selected_contract, (sel) => {
  if (sel && contractTarget) { contractTarget(sel); contractTarget = null }
})
</script>

<template>
  <div class="flex mb-[20px]">
    <div class="flex flex-col">
      <span class="text-lg font-semibold select-none">Модули</span>
      <span class="text-gray-500 text-sm select-none">Измените, добавьте или продлите тарифный план или модули</span>
    </div>
    <div
      style="margin-left: auto; margin-top: 5px;"
      @click="modalStore.hideModal"
    >
      <Icon
        icon="maki:cross"
        class="cursor-pointer"
      />
    </div>
  </div>

  <div
    v-if="!billingStateStore.moduleMetadataConfigured"
    class="text-gray-500 text-sm select-none py-6"
  >
    Каталог не настроен: задайте корневой раздел каталога модулей.
  </div>

  <div
    v-else
    class="flex flex-col gap-[15px]"
  >
    <div
      v-for="cat in categories"
      :key="cat.name"
      class="flex flex-col"
    >
      <!-- Заголовок категории -->
      <div
        class="block-module blue-hover"
        @click="toggleCat(cat.name)"
      >
        <span class="font-semibold select-none hover-item">{{ cat.name }}</span>
        <span
          v-if="cat.modules.length"
          class="text-gray-400 text-xs ml-2 select-none"
        >{{ cat.modules.length }}</span>
        <Icon
          style="margin-left: auto;"
          class="hover-item"
          :icon="openCats.has(cat.name) ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"
        />
      </div>

      <!-- Содержимое категории -->
      <div
        v-if="openCats.has(cat.name)"
        class="flex flex-col"
      >
        <!-- Существующие модули -->
        <div
          v-for="m in cat.modules"
          :key="m.id"
        >
          <div
            class="item-module blue-hover cursor-pointer mt-[10px]"
            @click="toggleModule(m)"
            @mouseleave="menuOpen[m.id] = false"
          >
            <div class="flex items-center gap-[16px]">
              <div @click.stop>
                <CheckboxRoot
                  :model-value="m.active"
                  :disabled="!bitrixStateStore.canEditData"
                  :class="m.active ? 'checkbox-active' : 'checkbox-disable'"
                  @update:model-value="toggleActive(m)"
                >
                  <CheckboxIndicator>
                    <Icon
                      icon="radix-icons:check"
                      style="color: white;"
                    />
                  </CheckboxIndicator>
                </CheckboxRoot>
              </div>
              <span
                class="select-none text-sm"
                style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 320px;"
              >{{ m.title }}</span>
            </div>
            <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 12px; align-items: center;">
              <div
                v-if="bitrixStateStore.canEditData"
                style="position: relative;"
              >
                <Icon
                  icon="material-symbols:more-vert"
                  class="cursor-pointer"
                  @click.stop="menuOpen[m.id] = !menuOpen[m.id]"
                />
                <div
                  v-show="menuOpen[m.id]"
                  class="menu-edit-container"
                  @click.stop
                >
                  <div
                    class="flex gap-2 py-1 px-2 blue-hover items-center cursor-pointer"
                    @click.stop="menuOpen[m.id] = false; toggleModule(m)"
                  >
                    <Icon
                      icon="mdi:edit"
                      class="text-gray-500 w-4 h-4 hover-item"
                    />
                    <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                  </div>
                  <div
                    class="flex gap-2 py-1 px-2 blue-hover items-center cursor-pointer"
                    @click.stop="removeModule(m)"
                  >
                    <Icon
                      icon="mdi:trash-outline"
                      class="text-red-500 w-4 h-4"
                    />
                    <span class="text-red-500 text-sm select-none">Удалить</span>
                  </div>
                </div>
              </div>
              <Icon :icon="buffers[m.id] ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'" />
            </div>
          </div>

          <!-- Инлайн-редактор модуля -->
          <div
            v-if="buffers[m.id]"
            class="flex flex-col gap-[12px] px-[15px] py-[12px]"
          >
            <div class="flex gap-[12px]">
              <InputBox
                v-model="buf(m.id).title"
                :resize="false"
                title="Название"
                :required="true"
                :disabled="!bitrixStateStore.canEditData"
                style="width: 50%;"
              />
              <InputBox
                v-model="buf(m.id).price"
                type="number"
                :resize="false"
                title="Цена, ₽"
                :disabled="!bitrixStateStore.canEditData"
                style="width: 25%;"
              />
              <InputBox
                v-model="buf(m.id).quantity"
                type="number"
                :resize="false"
                title="Количество"
                :disabled="!bitrixStateStore.canEditData"
                style="width: 25%;"
              />
            </div>
            <div
              v-if="ungroupedFor(m.parent_product_id).length"
              class="fields-grid"
            >
              <DynamicField
                v-for="field in ungroupedFor(m.parent_product_id)"
                :key="field.code"
                v-model="buf(m.id).values[field.code]"
                :field="field"
                :disabled="!bitrixStateStore.canEditData"
              />
            </div>
            <div
              v-for="group in visibleGroupsFor(m.parent_product_id)"
              :key="group.name"
              class="fields-grid"
            >
              <MultiSelectGroup
                v-model="buf(m.id).values"
                :title="group.name"
                :fields="groupFieldsFor(m.parent_product_id, group.fields)"
                :disabled="!bitrixStateStore.canEditData"
              />
            </div>
            <div
              class="flex gap-[10px]"
              style="align-items: end;"
            >
              <Selector
                v-model="buf(m.id).contract"
                style="width: 100%;"
                title="Договор"
                :required="true"
                :disabled="!bitrixStateStore.canEditData"
                :items="contractItems"
              />
              <div
                v-if="bitrixStateStore.canEditData"
                class="add-contract-btn blue-hover flex justify-center items-center"
                @click="openAddContract(sel => buf(m.id).contract = sel)"
              >
                <Icon
                  icon="rivet-icons:plus"
                  class="w-4 h-4 hover-item"
                />
              </div>
            </div>
            <div
              v-if="bitrixStateStore.canEditData"
              class="save-btn justify-center items-center px-[12px] py-[8px]"
              style="margin-left: auto; width: fit-content;"
              @click="saveModule(m)"
            >
              <span
                class="select-none text-sm"
                style="color: white;"
              >Сохранить</span>
            </div>
          </div>
        </div>

        <!-- Черновики новых модулей -->
        <div
          v-for="(d, i) in draftsFor(cat.name)"
          :key="'d' + i"
          class="flex flex-col gap-[12px] px-[15px] py-[12px] draft-box mt-[10px]"
        >
          <div class="flex gap-[12px]">
            <Selector
              v-if="cat.kinds.length > 1"
              v-model="d.kind"
              style="width: 50%;"
              title="Вид модуля"
              :required="true"
              :items="kindItemsFor(cat)"
              @update:model-value="onDraftKind(d)"
            />
            <InputBox
              v-model="d.title"
              :resize="false"
              title="Название"
              :required="true"
              :style="cat.kinds.length > 1 ? 'width: 50%;' : 'width: 100%;'"
            />
          </div>
          <div class="flex gap-[12px]">
            <InputBox
              v-model="d.price"
              type="number"
              :resize="false"
              title="Цена, ₽"
              style="width: 50%;"
            />
            <InputBox
              v-model="d.quantity"
              type="number"
              :resize="false"
              title="Количество"
              style="width: 50%;"
            />
          </div>
          <template v-if="d.kind">
            <div
              v-if="ungroupedFor(Number(d.kind.label)).length"
              class="fields-grid"
            >
              <DynamicField
                v-for="field in ungroupedFor(Number(d.kind.label))"
                :key="field.code"
                v-model="d.values[field.code]"
                :field="field"
              />
            </div>
            <div
              v-for="group in visibleGroupsFor(Number(d.kind.label))"
              :key="group.name"
              class="fields-grid"
            >
              <MultiSelectGroup
                v-model="d.values"
                :title="group.name"
                :fields="groupFieldsFor(Number(d.kind.label), group.fields)"
              />
            </div>
          </template>
          <div
            class="flex gap-[10px]"
            style="align-items: end;"
          >
            <Selector
              v-model="d.contract"
              style="width: 100%;"
              title="Договор"
              :required="true"
              :items="contractItems"
            />
            <div
              class="add-contract-btn blue-hover flex justify-center items-center"
              @click="openAddContract(sel => d.contract = sel)"
            >
              <Icon
                icon="rivet-icons:plus"
                class="w-4 h-4 hover-item"
              />
            </div>
          </div>
          <div
            class="flex gap-[12px]"
            style="margin-left: auto; flex-direction: row-reverse;"
          >
            <div
              class="save-btn justify-center items-center px-[12px] py-[8px]"
              @click="saveDraft(cat.name, i)"
            >
              <span
                class="select-none text-sm"
                style="color: white;"
              >Сохранить</span>
            </div>
            <div
              class="close-btn blue-hover justify-center items-center px-[12px] py-[8px] cursor-pointer"
              @click="removeDraft(cat.name, i)"
            >
              <span class="select-none text-sm">Отмена</span>
            </div>
          </div>
        </div>

        <!-- Добавить проект -->
        <div
          v-if="bitrixStateStore.canEditData"
          class="flex justify-center blue-hover items-center close-btn gap-[10px] mt-[10px] cursor-pointer h-[35px]"
          @click="addDraft(cat)"
        >
          <Icon
            class="h-[12px] w-[12px] hover-item"
            icon="rivet-icons:plus"
          />
          <span class="font-semibold select-none hover-item text-sm">Добавить проект</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/any-container.css';
.fields-grid{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 10px; }
.block-module{
    height: 44px; padding: 10px 14px; display: flex; align-items: center;
    border: 1.5px solid #d9dbdf; border-radius: 8px; cursor: pointer;
}
.item-module{
    display: flex; height: 44px; align-items: center; border-radius: 8px; padding: 10px 14px;
}
.menu-edit-container{
    position: absolute; top: 100%; right: 0; z-index: 20;
    height: fit-content; width: fit-content; border-radius: 8px; padding: 4px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12); background: white; border: 1px solid #e7eaee;
}
.draft-box{ background: #f7fafc; border-radius: 8px; }
.add-contract-btn{ height: 38px; min-width: 38px; border: 1.5px solid #e7eaee; border-radius: 5px; cursor: pointer; }
.save-btn{ background: #3182ce; border-radius: 5px; cursor: pointer; }
.save-btn:hover{ background: #5899d7; transition: background 0.15s ease; }
.close-btn{ border: 1.5px solid #e7eaee; border-radius: 5px; }
.blue-hover:hover{ background-color: #ebf8ff; transition: background-color 0.15s ease; }
.blue-hover:hover .hover-item{ color: #437db4; transition: color 0.15s ease; }
.checkbox-disable{ background-color: #edf2f7; border: 1px solid #e7eaee; border-radius: 5px; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; }
.checkbox-active{ background-color: #3182ce; border: 1px solid #e7eaee; border-radius: 5px; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; }
</style>
