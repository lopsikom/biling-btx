<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { B24Frame } from '@bitrix24/b24jssdk'
import { Bitrix24Event, Bitrix24Placement } from '~/services/models'
import { unbindAllEvent, unbindAllPlacement } from '~/services/utils/utils'
import type { SelectorObject } from '~/services/models'
import { mockBitrixTypes, mockCatalogSections, mockEmptyCatalogSectionIds } from '~/services/mock'

// Установка приложения (portal binding, см. CONTEXT.md): перед первым запуском
// админ обязан выбрать смарт-процесс договора и раздел каталога — источник видов
// модулей. Без этого шаг блокирующий, installFinish не вызывается. При переустановке
// текущая привязка (если уже есть) подставляется в форму заранее.
interface CatalogSection { id: number, iblockSectionId: number | null, name: string }

const { $axios, $initializeB24Frame } = useNuxtApp()
const runtimeConfig = useRuntimeConfig()
const dev = runtimeConfig.public.dev

const badInstall = ref(false)
const errorTitle = ref()

type Phase = 'loading' | 'binding' | 'installing' | 'done'
const phase = ref<Phase>('loading')
const bindingLoad = ref(false)
const bindingError = ref('')
const folderWarning = ref('')
// Демо-режим: показывается, когда нет реального Bitrix-iframe (напр. открыли страницу
// напрямую в браузере при разработке) — тестовые данные, без единого сетевого запроса.
const isMockPreview = ref(false)

let frame: B24Frame

// --- Смарт-процесс договора ---
const types = ref<{ entityTypeId: number, title: string }[]>([])
const selectedType = ref<SelectorObject>()
const typeItems = computed(() => types.value.map(t => ({ label: t.entityTypeId, value: t.title } as SelectorObject)))

// --- Раздел каталога: каскад по уровням, псевдо-пункт «вся папка» останавливает спуск ---
const sections = ref<CatalogSection[]>([])
const childrenByParent = computed(() => {
  const map = new Map<number | null, CatalogSection[]>()
  for (const s of sections.value) {
    if (!map.has(s.iblockSectionId)) map.set(s.iblockSectionId, [])
    map.get(s.iblockSectionId)!.push(s)
  }
  return map
})
const FOLDER_WHOLE = -1
const levels = ref<SelectorObject[]>([])

function levelItems(depth: number): SelectorObject[] {
  const parentId = depth === 0 ? null : (levels.value[depth - 1]?.label as number | undefined)
  if (depth > 0 && parentId === undefined) return []
  const children = childrenByParent.value.get(depth === 0 ? null : (parentId as number)) ?? []
  const items = children.map(c => ({ label: c.id, value: c.name } as SelectorObject))
  if (depth > 0) items.unshift({ label: FOLDER_WHOLE, value: '— вся папка —' })
  return items
}
// Сколько селекторов рисовать: пока последний выбор — реальный узел с детьми
const levelsCount = computed(() => {
  if (!sections.value.length) return 0
  let d = 0
  while (true) {
    const chosen = levels.value[d]
    if (!chosen) return d + 1
    if (chosen.label === FOLDER_WHOLE) return d + 1
    const kids = childrenByParent.value.get(chosen.label as number) ?? []
    if (!kids.length) return d + 1
    d++
  }
})
function selectLevel(depth: number, value: SelectorObject | undefined) {
  levels.value = value ? [...levels.value.slice(0, depth), value] : levels.value.slice(0, depth)
}
// Итоговый выбор: последний уровень цепочки, кроме псевдо-«вся папка» (тогда берём его родителя)
const selectedSectionId = computed<number | undefined>(() => {
  const last = levels.value[levels.value.length - 1]
  if (!last) return undefined
  if (last.label === FOLDER_WHOLE) return levels.value[levels.value.length - 2]?.label as number | undefined
  return last.label as number
})
const selectedFolderLabel = computed(() => {
  if (selectedSectionId.value === undefined) return ''
  const names = levels.value.filter(v => v.label !== FOLDER_WHOLE).map(v => v.value).join(' → ')
  const whole = levels.value[levels.value.length - 1]?.label === FOLDER_WHOLE
  return whole ? `${names} (целиком)` : names
})
function buildPathTo(sectionId: number): SelectorObject[] {
  const byId = new Map(sections.value.map(s => [s.id, s]))
  const chain: SelectorObject[] = []
  let cur = byId.get(sectionId)
  while (cur) {
    chain.unshift({ label: cur.id, value: cur.name })
    cur = cur.iblockSectionId != null ? byId.get(cur.iblockSectionId) : undefined
  }
  return chain
}

// Предупреждение (не блок): выбранная папка пока пуста
watch(selectedSectionId, async (id) => {
  folderWarning.value = ''
  if (id === undefined) return
  if (isMockPreview.value) {
    if (mockEmptyCatalogSectionIds.has(id)) folderWarning.value = 'В выбранной папке пока нет товаров — модули будут недоступны, пока бизнес их не добавит.'
    return
  }
  try {
    const { productCount } = await $axios.getCatalogSectionProductsCount(id)
    if (productCount === 0) folderWarning.value = 'В выбранной папке пока нет товаров — модули будут недоступны, пока бизнес их не добавит.'
  } catch (e) {
    console.error(e)
  }
})

onMounted(async () => {
  try {
    frame = await $initializeB24Frame()
    $axios.setBitrixFrame = frame
    const data = frame.auth.getAuthData()
    if (!data) {
      badInstall.value = true
      return
    }
    const verify = await $axios.verifyBitrixUser(data.access_token)
    if (!verify) {
      badInstall.value = true
      return
    }
    await loadBindingOptions()
    phase.value = 'binding'
  } catch (e) {
    console.error(e)
    // Вне реального Bitrix-iframe (напр. страница открыта напрямую при разработке)
    // $initializeB24Frame не может договориться с родительским окном — в dev-режиме
    // показываем демо на тестовых данных вместо экрана ошибки (как index.vue делает
    // для основного виджета).
    // if (dev) {
    //   isMockPreview.value = true
    //   loadMockBindingOptions()
    //   phase.value = 'binding'
    //   return
    // }
    badInstall.value = true
    errorTitle.value = e
  }
})

function loadMockBindingOptions() {
  bindingError.value = ''
  types.value = mockBitrixTypes
  sections.value = mockCatalogSections
}

async function loadBindingOptions() {
  if (isMockPreview.value) {
    loadMockBindingOptions()
    return
  }
  bindingLoad.value = true
  bindingError.value = ''
  try {
    const [binding, typesList, sectionsList] = await Promise.all([
      $axios.getPortalBinding(),
      $axios.getBitrixTypes(),
      $axios.getCatalogSections()
    ])
    types.value = typesList
    sections.value = sectionsList
    if (binding.contract_entity_type_id) {
      selectedType.value = typeItems.value.find(t => t.label === binding.contract_entity_type_id)
    }
    if (binding.module_root_section_id) {
      levels.value = buildPathTo(binding.module_root_section_id)
    }
  } catch (e) {
    console.error(e)
    bindingError.value = 'Не удалось загрузить настройки из Bitrix24. Попробуйте обновить.'
  } finally {
    bindingLoad.value = false
  }
}

async function completeInstall() {
  bindingError.value = ''
  if (!selectedType.value) {
    bindingError.value = 'Выберите смарт-процесс договора'
    return
  }
  if (selectedSectionId.value === undefined) {
    bindingError.value = 'Выберите папку с товарами'
    return
  }
  bindingLoad.value = true
  try {
    if (isMockPreview.value) {
      phase.value = 'installing'
      await new Promise(resolve => setTimeout(resolve, 700))
      phase.value = 'done'
      return
    }
    await $axios.patchPortalBinding({
      contract_entity_type_id: Number(selectedType.value.label),
      module_root_section_id: selectedSectionId.value
    })
    phase.value = 'installing'
    await finishInstall()
  } catch (e) {
    console.error(e)
    bindingError.value = 'Не удалось сохранить привязку. Попробуйте ещё раз.'
  } finally {
    bindingLoad.value = false
  }
}

// Демо: собрать привязку заново, ничего в Bitrix при этом не менялось
function restartMockPreview() {
  selectedType.value = undefined
  levels.value = []
  folderWarning.value = ''
  bindingError.value = ''
  phase.value = 'binding'
}

async function finishInstall() {
  const url = runtimeConfig.public.BaseUri + runtimeConfig.public.BaseUrl
  try {
    await $axios.postPortalSync()
    await unbindAllEvent(frame)
    const eventsKeys = Object.values(Bitrix24Event)
    await Promise.all(eventsKeys.map(async (e) => {
      try {
        await frame.callMethod('event.bind', {
          event: e,
          handler: `${url}api/bitrix/webhook`
        })
      } catch (e) {
        console.error(e)
      }
    }))
    await unbindAllPlacement(frame)
    await Promise.all(Object.values(Bitrix24Placement).map(async (p) => {
      await frame.callMethod('placement.bind', {
        PLACEMENT: p,
        HANDLER: url,
        DESCRIPTION: 'DESCRIPTION',
        LANG_ALL: {
          en: {
            TITLE: dev ? 'Billing-dev' : 'Billing',
            DESCRIPTION: 'DESCRIPTION'
          },
          ru: {
            TITLE: dev ? 'Биллинг-dev' : 'Биллинг',
            DESCRIPTION: 'Описание'
          }
        }
      })
    }))
    frame.installFinish()
  } catch (e) {
    console.error(e)
    badInstall.value = true
    errorTitle.value = e
  }
}
</script>

<template>
  <div
    v-if="badInstall"
    class="flex flex-col justify-center items-center"
    style="height: 100vh;"
  >
    <p>Ошибка установки приложения</p>
    <p>{{ errorTitle }}</p>
  </div>
  <div
    v-else-if="phase === 'loading' || phase === 'installing'"
    class="flex flex-col justify-center items-center gap-3"
    style="height: 100vh;"
  >
    <Icon
      icon="line-md:loading-loop"
      width="120"
    />
    <p
      v-if="phase === 'installing'"
      class="text-gray-500"
    >
      Настраиваем приложение…
    </p>
  </div>
  <div
    v-else-if="phase === 'done'"
    class="flex justify-center"
    style="min-height: 100vh; padding: 60px 20px;"
  >
    <div
      class="any-white-container p-6 flex flex-col gap-4 items-start"
      style="width: 100%; max-width: 560px; height: fit-content;"
    >
      <span class="font-semibold text-lg">Готово (демо)</span>
      <span class="text-gray-500 text-sm">В реальной установке приложение сохранило бы эту привязку и завершило встраивание в Bitrix24. Это демо-режим — ничего никуда не отправлялось.</span>
      <div class="flex flex-col gap-1 text-sm">
        <span><b>Смарт-процесс:</b> {{ selectedType?.value }}</span>
        <span><b>Папка с товарами:</b> {{ selectedFolderLabel }}</span>
      </div>
      <div
        class="save-btn items-center flex px-3 py-2"
        @click="restartMockPreview()"
      >
        <span class="select-none text-sm text-slate-50 font-semibold">Начать заново</span>
      </div>
    </div>
  </div>
  <div
    v-else
    class="flex justify-center"
    style="min-height: 100vh; padding: 60px 20px;"
  >
    <div
      class="any-white-container p-6 flex flex-col gap-5"
      style="width: 100%; max-width: 560px; height: fit-content;"
    >
      <div class="flex flex-col gap-1">
        <span class="font-semibold text-lg">Привязка приложения</span>
        <span class="text-gray-500 text-sm">Выберите, что в вашем Bitrix24 считать договором и товарами биллинга — это можно сделать только сейчас, при установке</span>
        <span
          v-if="isMockPreview"
          class="text-xs text-blue-600"
        >Демо-режим: тестовые данные вне Bitrix24, ничего не сохраняется</span>
      </div>

      <!-- Смарт-процесс договора -->
      <div class="flex flex-col gap-2">
        <template v-if="!bindingLoad && !types.length">
          <span class="text-sm text-orange-600">В Bitrix24 нет ни одного смарт-процесса. Создайте его в CRM, затем нажмите «Обновить».</span>
        </template>
        <Selector
          v-else
          v-model="selectedType"
          title="Смарт-процесс договора"
          :items="typeItems"
        />
      </div>

      <!-- Раздел каталога (каскад) -->
      <div class="flex flex-col gap-2">
        <template v-if="!bindingLoad && !sections.length">
          <span class="text-sm text-orange-600">В каталоге Bitrix24 нет ни одного раздела. Создайте раздел с товарами, затем нажмите «Обновить».</span>
        </template>
        <template v-else>
          <span class="select-none font-semibold text-sm">Папка с товарами</span>
          <div class="flex flex-wrap gap-3">
            <Selector
              v-for="d in levelsCount"
              :key="d"
              :model-value="levels[d - 1]"
              :title="d === 1 ? 'Раздел' : 'Подраздел'"
              :items="levelItems(d - 1)"
              :width="240"
              @update:model-value="(v: SelectorObject | undefined) => selectLevel(d - 1, v)"
            />
          </div>
          <span
            v-if="selectedFolderLabel"
            class="text-sm text-gray-500"
          >Выбрано: {{ selectedFolderLabel }}</span>
          <span
            v-if="folderWarning"
            class="text-sm text-orange-600"
          >{{ folderWarning }}</span>
        </template>
      </div>

      <span
        v-if="bindingError"
        class="text-sm text-red-600"
      >{{ bindingError }}</span>

      <div class="flex gap-3 items-center">
        <div
          class="save-btn items-center flex px-3 py-2"
          @click="completeInstall()"
        >
          <span class="select-none text-sm text-slate-50 font-semibold">Готово</span>
        </div>
        <div
          class="refresh-btn items-center flex px-3 py-2 gap-1"
          @click="loadBindingOptions()"
        >
          <Icon
            icon="mdi:refresh"
            class="w-4 h-4"
          />
          <span class="select-none text-sm font-semibold">Обновить</span>
        </div>
        <Icon
          v-if="bindingLoad"
          icon="line-md:loading-loop"
          class="text-blue-600"
          width="24"
        />
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
    background: #edf2f7;
    border-radius: 10px;
    height: fit-content;
    cursor: pointer;
}
.refresh-btn:hover{
    background: #e2e8f0;
    transition: background 0.15s ease;
}
</style>
