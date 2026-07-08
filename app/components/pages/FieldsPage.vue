<script setup lang="ts">
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import useToastStore from '~/services/stores/toastStore'
import useConfirmStore from '~/services/stores/confirmStore'
import type { SelectorObject } from '~/services/models'
import type { IFieldGroup } from '~~/shared/models/APIModels'

// Страница «Поля»: два режима (тумблер) — поля договора (привязка смарт-процесса)
// и поля модулей (по видам каталога + мультиселект-группы, field group).
const billingStateStore = usebillingStateStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()
const { $axios } = useNuxtApp()

const isLoad = ref<boolean>(false)
const mode = ref<'contract' | 'module'>('contract')

// --- Режим договора ---
const types = ref<{ entityTypeId: number, title: string }[]>([])
const selectedType = ref<SelectorObject>()
const typeItems = computed(() => types.value.map(t => ({ label: t.entityTypeId, value: t.title } as SelectorObject)))
const fields = computed(() => billingStateStore.contractFields)

// --- Режим модулей ---
const selectedKind = ref<SelectorObject>()
const kindItems = computed(() => billingStateStore.moduleKinds.map(k => ({ label: k.parent_product_id, value: k.name } as SelectorObject)))
const kindId = computed(() => selectedKind.value ? Number(selectedKind.value.label) : undefined)
const kindFields = computed(() => kindId.value !== undefined ? (billingStateStore.moduleFieldsByKind[kindId.value] ?? []) : [])
// Только boolean-поля можно группировать в мультиселект
const groupableFields = computed(() => kindFields.value.filter(f => f.type === 'boolean'))
const kindGroups = computed(() => kindId.value !== undefined ? (billingStateStore.moduleGroupsByKind[kindId.value] ?? []) : [])

// Форма новой группы
const newGroupName = ref<string>('')
const newGroupFields = ref<string[]>([])
function toggleGroupField(code: string) {
  const i = newGroupFields.value.indexOf(code)
  if (i > -1) newGroupFields.value.splice(i, 1)
  else newGroupFields.value.push(code)
}

onMounted(async () => {
  isLoad.value = true
  try {
    const [binding, typesList] = await Promise.all([
      $axios.getPortalBinding(),
      $axios.getBitrixTypes()
    ])
    types.value = typesList
    if (binding.contract_entity_type_id) {
      selectedType.value = typeItems.value.find(t => t.label === binding.contract_entity_type_id)
    }
  } catch (e) {
    console.error(e)
    toastStore.openToast('Не удалось загрузить настройки привязки')
  } finally { isLoad.value = false }
})

// Сохранить новую группу (добавляется к существующим группам вида, replace всех разом)
async function saveGroup() {
  if (kindId.value === undefined) { toastStore.openToast('Выберите вид модуля'); return }
  if (!newGroupName.value.trim()) { toastStore.openToast('Введите имя группы'); return }
  if (newGroupFields.value.length < 2) { toastStore.openToast('Отметьте минимум 2 поля'); return }
  isLoad.value = true
  try {
    const groups: IFieldGroup[] = [...kindGroups.value, { name: newGroupName.value.trim(), fields: [...newGroupFields.value] }]
    const saved = await $axios.patchFieldGroups(kindId.value, groups)
    billingStateStore.moduleGroupsByKind = { ...billingStateStore.moduleGroupsByKind, [kindId.value]: saved }
    newGroupName.value = ''
    newGroupFields.value = []
    toastStore.openToast('Группа сохранена')
  } catch (e) {
    console.error(e)
    toastStore.openToast('Не удалось сохранить группу')
  } finally { isLoad.value = false }
}

// Удалить группу вида (replace оставшихся)
function removeGroup(name: string) {
  confirmStore.ask({
    title: 'Удалить группу?',
    message: `Группа «${name}» будет удалена. Поля снова станут отдельными полями формы.`,
    onConfirm: () => doRemoveGroup(name)
  })
}

async function doRemoveGroup(name: string) {
  if (kindId.value === undefined) return
  isLoad.value = true
  try {
    const groups = kindGroups.value.filter(g => g.name !== name)
    const saved = await $axios.patchFieldGroups(kindId.value, groups)
    billingStateStore.moduleGroupsByKind = { ...billingStateStore.moduleGroupsByKind, [kindId.value]: saved }
    toastStore.openToast('Группа удалена')
  } catch (e) {
    console.error(e)
    toastStore.openToast('Не удалось удалить группу')
  } finally { isLoad.value = false }
}

async function saveBinding() {
  if (!selectedType.value) { toastStore.openToast('Выберите смарт-процесс'); return }
  isLoad.value = true
  try {
    await $axios.patchPortalBinding({ contract_entity_type_id: Number(selectedType.value.label) })
    const metadata = await $axios.getContractMetadata(true)
    billingStateStore.contractFields = metadata.fields
    billingStateStore.metadataConfigured = metadata.configured
    toastStore.openToast('Привязка сохранена, поля обновлены')
  } catch (e) {
    console.error(e)
    toastStore.openToast('Не удалось сохранить привязку')
  } finally { isLoad.value = false }
}

async function refreshFields() {
  isLoad.value = true
  try {
    const metadata = await $axios.getContractMetadata(true)
    billingStateStore.contractFields = metadata.fields
    billingStateStore.metadataConfigured = metadata.configured
    toastStore.openToast('Поля обновлены из Bitrix')
  } catch (e) {
    console.error(e)
    toastStore.openToast('Не удалось обновить поля')
  } finally { isLoad.value = false }
}

const typeNames: Record<string, string> = {
  string: 'Строка',
  integer: 'Целое число',
  double: 'Число',
  boolean: 'Да/Нет',
  date: 'Дата',
  datetime: 'Дата и время',
  enumeration: 'Список',
  money: 'Деньги',
  url: 'Ссылка'
}
</script>

<template>
  <div class="flex flex-col">
    <div class="any-white-container px-5 py-4 flex flex-col">
      <div class="flex">
        <div class="flex flex-col gap-1">
          <span class="select-none font-semibold">{{ mode === 'contract' ? 'Поля договора' : 'Поля модулей' }}</span>
          <span class="text-gray-500">{{ mode === 'contract' ? 'Привязка смарт-процесса и поля, которые видит виджет' : 'Поля видов и мультиселект-группы' }}</span>
        </div>
        <div
          class="flex gap-3"
          style="margin-left: auto;"
        >
          <div class="mode-toggle flex">
            <div
              class="mode-btn"
              :class="{ 'mode-btn-active': mode === 'contract' }"
              @click="mode = 'contract'"
            >
              Договор
            </div>
            <div
              class="mode-btn"
              :class="{ 'mode-btn-active': mode === 'module' }"
              @click="mode = 'module'"
            >
              Модули
            </div>
          </div>
          <div
            v-if="mode === 'contract'"
            class="refresh-btn items-center flex px-2 py-2 gap-1"
            @click="refreshFields()"
          >
            <Icon
              icon="mdi:refresh"
              class="w-5 h-5 text-slate-50"
            />
            <span class="select-none text-sm text-slate-50 font-semibold">Обновить из Bitrix</span>
          </div>
        </div>
      </div>
      <!-- Режим: поля договора -->
      <template v-if="mode === 'contract'">
        <div class="flex mt-5 gap-5 items-end">
          <Selector
            v-model="selectedType"
            title="Смарт-процесс договора"
            :items="typeItems"
            :width="300"
          />
          <div
            class="save-btn items-center flex px-3 py-2"
            @click="saveBinding()"
          >
            <span class="select-none text-sm text-slate-50 font-semibold">Сохранить привязку</span>
          </div>
        </div>
        <div
          v-if="isLoad"
          class="flex items-center justify-center py-10"
        >
          <Icon
            icon="line-md:loading-loop"
            class="text-blue-600"
            width="40"
          />
        </div>
        <div
          v-else-if="fields.length"
          class="fields-list mt-5"
        >
          <div
            class="fields-row font-semibold"
            style="border-width: 0;"
          >
            <div>Название</div>
            <div>Код поля</div>
            <div>Тип</div>
            <div>Обязательное</div>
            <div>Варианты</div>
          </div>
          <div
            v-for="field in fields"
            :key="field.code"
            class="fields-row"
          >
            <div>{{ field.title }}</div>
            <div class="text-gray-500 text-sm">
              {{ field.code }}
            </div>
            <div>{{ typeNames[field.type] ?? field.type }}</div>
            <div>{{ field.isRequired ? "Да" : "Нет" }}</div>
            <div class="text-sm text-gray-500">
              {{ field.items?.map(i => i.value).join(", ") }}
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex items-center justify-center py-10 text-gray-500 select-none"
        >
          Поля не загружены: выберите смарт-процесс и сохраните привязку
        </div>
      </template>

      <!-- Режим: поля модулей + мультиселект-группы -->
      <template v-else>
        <div class="flex mt-5 gap-5 items-end">
          <Selector
            v-model="selectedKind"
            title="Вид модуля"
            :items="kindItems"
            :width="300"
          />
        </div>

        <div
          v-if="kindId === undefined"
          class="flex items-center justify-center py-10 text-gray-500 select-none"
        >
          Выберите вид модуля, чтобы увидеть поля и группы
        </div>
        <template v-else>
          <!-- Поля вида -->
          <div class="fields-list mt-5">
            <div
              class="fields-row font-semibold"
              style="border-width: 0;"
            >
              <div>Название</div>
              <div>Код поля</div>
              <div>Тип</div>
              <div>Обязательное</div>
              <div>Варианты</div>
            </div>
            <div
              v-for="field in kindFields"
              :key="field.code"
              class="fields-row"
            >
              <div>{{ field.title }}</div>
              <div class="text-gray-500 text-sm">
                {{ field.code }}
              </div>
              <div>{{ typeNames[field.type] ?? field.type }}</div>
              <div>{{ field.isRequired ? "Да" : "Нет" }}</div>
              <div class="text-sm text-gray-500">
                {{ field.items?.map(i => i.value).join(", ") }}
              </div>
            </div>
          </div>

          <!-- Группы вида -->
          <div class="mt-6 flex flex-col gap-2">
            <span class="select-none font-semibold">Мультиселект-группы</span>
            <span class="text-gray-500 text-sm">Объединяют несколько «Да/Нет» полей в один селектор в форме модуля</span>
            <div
              v-if="kindGroups.length"
              class="flex flex-col gap-2 mt-2"
            >
              <div
                v-for="g in kindGroups"
                :key="g.name"
                class="group-row flex items-center gap-3 py-2 px-3"
              >
                <span class="font-semibold text-sm">{{ g.name }}</span>
                <span class="text-gray-500 text-xs">
                  {{ g.fields.map(code => kindFields.find(f => f.code === code)?.title ?? code).join(", ") }}
                </span>
                <Icon
                  icon="mdi:trash-can-outline"
                  class="w-5 h-5 text-red-500 cursor-pointer"
                  style="margin-left: auto;"
                  @click="removeGroup(g.name)"
                />
              </div>
            </div>
            <div
              v-else
              class="text-gray-500 text-sm py-2"
            >
              Групп нет
            </div>
          </div>

          <!-- Создание группы -->
          <div
            v-if="groupableFields.length >= 2"
            class="any-white-container p-4 mt-3 flex flex-col gap-3"
          >
            <span class="select-none font-semibold text-sm">Новая группа</span>
            <InputBox
              v-model="newGroupName"
              placeholder="Имя группы"
              :resize="false"
              title="Название"
              style="width: 50%;"
            />
            <div class="flex flex-col gap-1">
              <span class="text-sm text-gray-500">Поля группы (только «Да/Нет»)</span>
              <div class="flex flex-wrap gap-3 mt-1">
                <label
                  v-for="f in groupableFields"
                  :key="f.code"
                  class="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    :checked="newGroupFields.includes(f.code)"
                    @change="toggleGroupField(f.code)"
                  >
                  <span class="text-sm">{{ f.title }}</span>
                </label>
              </div>
            </div>
            <div
              class="save-btn items-center flex px-3 py-2"
              style="width: fit-content;"
              @click="saveGroup()"
            >
              <span class="select-none text-sm text-slate-50 font-semibold">Сохранить группу</span>
            </div>
          </div>
          <div
            v-else
            class="text-gray-500 text-sm py-3"
          >
            У этого вида недостаточно «Да/Нет» полей для группировки (нужно минимум 2)
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/any-container.css';
.save-btn{
    background: #3182ce;
    border-radius: 10px;
    height: fit-content;
    cursor: pointer;
}
.save-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}
.refresh-btn{
    background: #3182ce;
    border-radius: 10px;
    height: fit-content;
    cursor: pointer;
}
.refresh-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}
.fields-list{
    display: grid;
    grid-auto-rows: auto;
    width: 100%;
}
.fields-row{
    display: grid;
    grid-template-columns: minmax(200px, 1.5fr) minmax(200px, 1.5fr) minmax(120px, 1fr) minmax(100px, 0.7fr) minmax(200px, 2fr);
    align-items: center;
    gap: 10px;
    border-top: 1px solid #d1d5db;
    padding: 10px 5px 10px 5px;
}
.mode-toggle{
    background: #edf2f7;
    border-radius: 8px;
    padding: 3px;
    height: fit-content;
    align-self: center;
}
.mode-btn{
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    color: #64748b;
}
.mode-btn-active{
    background: white;
    color: #3182ce;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.group-row{
    border: 1px solid #e7eaee;
    border-radius: 8px;
}
</style>
