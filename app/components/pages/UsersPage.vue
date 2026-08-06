<script setup lang="ts">
import SearchIcon from '@bitrix24/b24icons-vue/outline/SearchIcon'
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import type { SelectorObject } from '~/services/models'
import useModalStore from '~/services/stores/modalStore'
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum'
import type { IContract, IContractFilter } from '~~/shared/models/APIModels'
import useToastStore from '~/services/stores/toastStore'

const billingStateStore = usebillingStateStore()
const bitrixStateStore = useBitrixStateStore()
const modalStore = useModalStore()
const toastStore = useToastStore()
const { $axios } = useNuxtApp()
const countContracts = ref<number>(0)
const limitPagination = ref<number>(10)
const isLoad = ref<boolean>(false)
const search = ref<string>()

// Динамические фильтры: селектор на каждое enumeration-поле из зеркала метаданных
const ALL_OPTION: SelectorObject = { label: 0, value: 'Все' }
const filterFields = computed(() => billingStateStore.contractFields.filter(f => f.type === 'enumeration'))
const filterValues = ref<Record<string, SelectorObject>>({})
function filterItems(code: string): SelectorObject[] {
  const field = filterFields.value.find(f => f.code === code)
  const a = (field?.items ?? []).map(i => ({ label: i.id, value: i.value } as SelectorObject))
  a.unshift(ALL_OPTION)
  return a
}

// Дефолт каждого фильтра — «Все» (id 0), чтобы селектор не выглядел пустым.
// Поля грузятся асинхронно из метаданных — инициализируем по их появлении.
function initFilterDefaults() {
  for (const f of filterFields.value) {
    if (!filterValues.value[f.code]) filterValues.value[f.code] = ALL_OPTION
  }
}
watch(filterFields, initFilterDefaults, { immediate: true })

// Фильтр по организации (mycompanyId) — системное поле Bitrix, лежит в values как часть зеркала целиком
const myCompanyFilterItems = computed<SelectorObject[]>(() => {
  const a = bitrixStateStore.bitrixisMyCompanys.map(c => ({ label: c.id, value: c.title } as SelectorObject))
  a.unshift(ALL_OPTION)
  return a
})
const myCompanyFilter = ref<SelectorObject>(ALL_OPTION)
function myCompanyTitle(contract: IContract): string {
  const id = contract.values?.mycompanyId
  if (id === undefined || id === null) return '—'
  return bitrixStateStore.bitrixisMyCompanys.find(c => String(c.id) === String(id))?.title ?? '—'
}

// Столбцы таблицы: по дефолту — все поля из зеркала метаданных договора.
// (позже сузится настройкой портала)
const columns = computed(() => billingStateStore.contractFields)

// Человекочитаемое значение ячейки: enum → value по id, даты — локально, прочее — как есть
function cellValue(contract: IContract, field: typeof columns.value[number]): string {
  const raw = contract.values?.[field.code]
  if (raw === undefined || raw === null || raw === '') return '—'
  if (field.type === 'enumeration') {
    const ids = Array.isArray(raw) ? raw : [raw]
    return ids.map(id => field.items?.find(i => String(i.id) === String(id))?.value ?? String(id)).join(', ')
  }
  if (field.type === 'boolean') return (raw === true || raw === 'Y' || raw === 1 || raw === '1') ? 'Да' : 'Нет'
  if (field.type === 'date' || field.type === 'datetime') {
    const d = new Date(String(raw))
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString('ru-RU')
  }
  return String(raw)
}

const timeOutSearch = ref<NodeJS.Timeout>()

function openEdit(item: IContract) {
  modalStore.EditContract = item
  modalStore.showModal(ModalEnum.EDIT_CONTRACT)
}

function clearFilter() {
  filterValues.value = {}
  initFilterDefaults()
  myCompanyFilter.value = ALL_OPTION
  search.value = ''
  toastStore.openToast('Фильтр очищен')
}

const pagePagination = ref(1)

async function getContractPagination() {
  isLoad.value = true
  try {
    const filter = {} as Partial<IContractFilter>
    const values: Record<string, unknown> = {}
    for (const [code, selected] of Object.entries(filterValues.value)) {
      if (selected && selected.label !== 0) values[code] = Number(selected.label)
    }
    if (myCompanyFilter.value && myCompanyFilter.value.label !== 0) values.mycompanyId = Number(myCompanyFilter.value.label)
    if (Object.keys(values).length) filter.values = values
    if (search.value?.trim() !== '') filter.name = search.value
    const data = await $axios.getContracts({
      filter: filter,
      pagination: {
        skip: (pagePagination.value - 1) * limitPagination.value,
        limit: limitPagination.value
      }
    })
    countContracts.value = data.count
    billingStateStore.contracts = data.data
  } catch (e) {
    console.error(e)
    toastStore.openToast('Ошибка получения событий')
  } finally { isLoad.value = false }
}

onMounted(async () => {
  await getContractPagination()
})

watch(() => [
  pagePagination.value],
async () => { await getContractPagination() })
watch(filterValues, async () => { await getContractPagination() }, { deep: true })
watch(myCompanyFilter, async () => {
  await getContractPagination()
})
watch(() => billingStateStore.isRefreshContracts, async () => {
  if (billingStateStore.isRefreshContracts) {
    await getContractPagination()
    billingStateStore.isRefreshContracts = false
  }
})
// watch(() => search.value,
// async (newSearch, oldSearch) => {
//     search.value = search.value!.trimStart()
//     if(search.value?.trim() !== ""){
//         if(timeOutSearch.value) {
//             clearTimeout(timeOutSearch.value)
//             timeOutSearch.value = undefined;
//         }
//         timeOutSearch.value = setTimeout(async () => await getContractPagination(), 500)
//     }else {
//         if(oldSearch?.length !== 0 && newSearch?.length ===0) {
//             await getContractPagination()
//         }
//     }
// })
const clearInputSearch = ref(false)
async function inputSearch(e: InputEvent) {
  search.value = search.value!.trimStart()
  if (search.value?.trim() !== '') {
    if (timeOutSearch.value) {
      clearTimeout(timeOutSearch.value)
      timeOutSearch.value = undefined
    }
    timeOutSearch.value = setTimeout(async () => await getContractPagination(), 500)
    clearInputSearch.value = true
  } else {
    if (clearInputSearch.value) {
      clearTimeout(timeOutSearch.value)
      clearInputSearch.value = false
      await getContractPagination()
    }
  }
}
</script>

<template>
  <div class="flex flex-col">
    <div class="any-white-container px-5 py-4 flex flex-col h-[840px]">
      <div class="flex">
        <div class="flex flex-col gap-1">
          <span class="select-none font-semibold">Договора</span>
          <span class="text-gray-500">Управление договорами организации</span>
        </div>
        <div
          class="flex gap-5"
          style="margin-left: auto;"
        >
          <div
            class="clear-filter-btn items-center flex px-2 py-2 gap-1"
            @click="clearFilter()"
          >
            <Icon
              icon="tdesign:filter-clear-filled"
              class="w-5 h-5 text-slate-50"
            />
            <span class="select-none text-sm text-slate-50 font-semibold">Очистить фильтр</span>
          </div>
          <div
            v-if="bitrixStateStore.canEditData"
            class="add-user-btn items-center flex px-2 py-2 gap-1"
            @click="modalStore.showModal(ModalEnum.ADD_CONTRACT)"
          >
            <Icon
              icon="basil:document-solid"
              class="w-5 h-5 text-slate-50"
            />
            <span class="select-none text-sm text-slate-50 font-semibold">Добавить договор</span>
          </div>
        </div>
      </div>
      <div class="flex mt-5 gap-5 items-center">
        <div class="search-box flex gap-3">
          <SearchIcon class="w-5.5 h-5.5 text-gray-400" />
          <textarea
            v-model="search"
            type="text"
            rows="1"
            placeholder="Поиск по названию..."
            class="search-input text-sm"
            @input="(e) => inputSearch(e)"
          />
        </div>
      </div>
      <div class="flex mt-[15px] gap-5 flex-wrap">
        <div class="flex">
          <Selector
            v-model="myCompanyFilter"
            title="Организация"
            :items="myCompanyFilterItems"
            :width="200"
          />
        </div>
        <div
          v-for="field in filterFields"
          :key="field.code"
          class="flex"
        >
          <Selector
            v-model="filterValues[field.code]"
            :title="field.title"
            :items="filterItems(field.code)"
            :width="200"
          />
        </div>
      </div>
      <div class="h-[72%]">
        <div
          v-if="(countContracts && countContracts > 0) || isLoad"
          class="flex flex-col h-[100%]"
        >
          <div
            v-if="isLoad"
            class="flex items-center font-semibold text-lg
                            justify-center h-[100%] select-none"
          >
            <Icon
              icon="line-md:loading-loop"
              class="text-blue-600"
              width="60"
            />
          </div>
          <div
            v-else
            class="users-list-scroll mt-[30px]"
          >
            <div class="users-list-grid">
              <div
                class="users-list-row h-[50px]"
                style="border-width: 0;"
                :style="{ gridTemplateColumns: `minmax(160px, 1fr) minmax(140px, 1fr) repeat(${columns.length}, minmax(140px, 1fr))` }"
              >
                <div class="font-semibold">
                  Имя
                </div>
                <div class="font-semibold cell-ellipsis">
                  Организация
                </div>
                <div
                  v-for="col in columns"
                  :key="col.code"
                  class="font-semibold cell-ellipsis"
                >
                  {{ col.title }}
                </div>
              </div>
              <div style="overflow-y: auto; overflow-x: hidden;">
                <div
                  v-for="(value, index) in billingStateStore.contracts"
                  :key="index"
                >
                  <div
                    class="users-list-row users-item"
                    :style="{ gridTemplateColumns: `minmax(160px, 1fr) minmax(140px, 1fr) repeat(${columns.length}, minmax(140px, 1fr))` }"
                    @click="openEdit(value)"
                  >
                    <p class="cell-ellipsis">
                      {{ value.name }}
                    </p>
                    <p class="cell-ellipsis text-gray-600 text-sm">
                      {{ myCompanyTitle(value) }}
                    </p>
                    <p
                      v-for="col in columns"
                      :key="col.code"
                      class="cell-ellipsis text-gray-600 text-sm"
                    >
                      {{ cellValue(value, col) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex items-center font-semibold text-lg
                        justify-center h-[100%] select-none"
        >
          Записи отсуствуют
        </div>
      </div>
      <PaginationRoot
        v-if="countContracts && countContracts > 0"
        v-model:page="pagePagination"
        :total="countContracts"
        :sibling-count="2"
        :items-per-page="limitPagination"
        show-edges
        :default-page="1"
        style="margin-top: auto;"
      >
        <PaginationList
          v-slot="{ items }"
          class="PaginationList"
        >
          <PaginationFirst class="Button">
            <Icon icon="radix-icons:double-arrow-left" />
          </PaginationFirst>
          <PaginationPrev
            :style="{ marginRight: 16 }"
            class="Button"
          >
            <Icon icon="radix-icons:chevron-left" />
          </PaginationPrev>
          <template v-for="(page, index) in items">
            <PaginationListItem
              v-if="page.type === 'page'"
              :key="index"
              class="Button"
              :value="page.value"
            >
              {{ page.value }}
            </PaginationListItem>
            <PaginationEllipsis
              v-else
              :key="page.type"
              :index="index"
              class="PaginationEllipsis"
            >
              &#8230;
            </PaginationEllipsis>
          </template>
          <PaginationNext
            :style="{ marginLeft: 16 }"
            class="Button"
          >
            <Icon icon="radix-icons:chevron-right" />
          </PaginationNext>
          <PaginationLast class="Button">
            <Icon icon="radix-icons:double-arrow-right" />
          </PaginationLast>
        </PaginationList>
      </PaginationRoot>
    </div>
  </div>
</template>

<style scoped>
    @import '~/assets/css/any-container.css';

.Button{
  text-align: center;
  font-size: 15px;
  line-height: 1;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  width: 2.25rem;
  border-radius: 0.25rem;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.checkbox-disable{
    background-color: #edf2f7;
    border-color: #e7eaee;
    border-width: 1.0px;
    border-radius: 5px;
    display: flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
}
.checkbox-active{
    background-color: #3182ce;
    border-color: #e7eaee;
    border-width: 1.0px;
    border-radius: 5px;
    display: flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
}

.Button:disabled {
  opacity: .5
}

.Button:hover{
  background-color: white
}

.Button[data-selected]{
  background-color: #3989d1;
  color: rgb(255 255 255);
}

.PaginationEllipsis{
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center
}

.PaginationList{
  display: flex;
  align-items: center;
  margin-top: auto;
  gap: 0.25rem;
  color: black
}

.add-user-btn{
    background: #3182ce;
    border-radius: 10px;
    height: fit-content;
}
.clear-filter-btn{
    background: red;
    border-radius: 10px;
    height: fit-content;
}
.add-user-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}
.clear-filter-btn:hover{
    background: rgb(255, 49, 49);
    transition: background 0.15s ease;
}
.search-box{
    height: 40px;
    padding: 7px 10px;
    background-color: #edf2f7;
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 0, 0);
    width: 100%;
    align-items: center;
}
.search-input{
    resize: none;
    width: 100%;
    outline: none;
}

.search-box:focus-within{
    border-color: #9bc6e8b1;
    box-shadow: 0 0 8px rgba(158, 203, 238);
    transition: border-color 0.15s ease;
    transition: box-shadow 0.15s ease;
}
.users-list-scroll{
    overflow-x: auto;
    width: 100%;
}
.users-list-grid{
    display: grid;
    grid-auto-rows: auto;
    width: 100%;
}
.users-list-row{
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    gap: 10px;
    border-top: 1px solid #d1d5db;
    padding: 10px 5px 10px 5px;
}
.users-list-row > * {
    min-width: 0;
    overflow: hidden;
}
.cell-ellipsis{
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}
.status-box{
    align-self: center;
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: row;
    padding: 2px 8px;
    height: 22px;
    gap: 3px;
    border-radius: 5px;
    width: fit-content;
}
.status-box-active{
    background-color: #3989d1;
    -webkit-text-fill-color: white;
}
.status-box-disable{
     background-color: #fd3d3d;
    -webkit-text-fill-color: white;
}
.users-item:hover{
    background-color: #ebf8ff;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.users-item:hover .role-box{
    background-color: #ebf8ff;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
</style>
