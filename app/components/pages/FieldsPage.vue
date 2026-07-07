<script setup lang="ts">
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import useToastStore from '~/services/stores/toastStore'
import type { SelectorObject } from '~/services/models'

// Страница «Поля»: привязка портала (какой смарт-процесс — договор) и
// зеркало метаданных полей — что виджет знает о полях, кнопка принудительного обновления.
const billingStateStore = usebillingStateStore()
const toastStore = useToastStore()
const { $axios } = useNuxtApp()

const isLoad = ref<boolean>(false)
const types = ref<{ entityTypeId: number, title: string }[]>([])
const selectedType = ref<SelectorObject>()

const typeItems = computed(() => types.value.map(t => ({ label: t.entityTypeId, value: t.title } as SelectorObject)))
const fields = computed(() => billingStateStore.contractFields)

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
          <span class="select-none font-semibold">Поля договора</span>
          <span class="text-gray-500">Привязка смарт-процесса и поля, которые видит виджет</span>
        </div>
        <div
          class="flex gap-5"
          style="margin-left: auto;"
        >
          <div
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
</style>
