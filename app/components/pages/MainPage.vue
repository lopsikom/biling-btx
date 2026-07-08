<script setup lang="ts">
import SuccessIcon from '@bitrix24/b24icons-vue/button/SuccessIcon'
import MoreIcon from '@bitrix24/b24icons-vue/actions/MoreIcon'
import Cross25Icon from '@bitrix24/b24icons-vue/actions/Cross25Icon'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import useModalStore from '~/services/stores/modalStore'
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum'
import usebillingStateStore from '~/services/stores/billingStateStore'
import { Icon } from '@iconify/vue'
import { connectionTypesEnum, type IConnection, type IConnectionStatus, type IConnectionType } from '~~/shared/models/APIModels'
import useToastStore from '~/services/stores/toastStore'

const bitrixStateStore = useBitrixStateStore()
const billingStateStore = usebillingStateStore()
const modalStore = useModalStore()
const toastStore = useToastStore()
const { $axios } = useNuxtApp()

type ModuleType = {
  title: string
  count: number
}

// Плитки модулей: группировка по КАТЕГОРИИ-папке каталога (ВАТС, Чат-бот…).
// Вид → его категория берётся из метаданных (moduleKinds). Модули без категории
// (вид вне «Нового каталога») группируются по имени вида как фолбэк.
const modulesComputed = computed(() => {
  const kindOf = (pid: number) => billingStateStore.moduleKinds.find(k => k.parent_product_id === pid)
  const counts = new Map<string, number>()
  for (const m of billingStateStore.modules) {
    if (!m.active) continue
    const kind = kindOf(m.parent_product_id)
    const title = kind?.category_name ?? kind?.name ?? `Товар ${m.parent_product_id}`
    counts.set(title, (counts.get(title) ?? 0) + 1)
  }
  const data: ModuleType[] = []
  for (const [title, count] of counts) data.push({ title, count })
  return data
})

const ModulesCount = computed(() => billingStateStore.modules.length)

interface IConnectionWithType extends IConnection {
  typeData: IConnectionType
  statusData: IConnectionStatus
  isOpen: boolean
}

const connectionsComputed = computed(() => {
  const data: Record<connectionTypesEnum, IConnectionWithType[]> = {
    [connectionTypesEnum.MESSENGERS]: [],
    [connectionTypesEnum.SMS]: [],
    [connectionTypesEnum.VATS]: [],
    [connectionTypesEnum.ANOTHER]: []
  }
  const connections = Array.isArray(billingStateStore.connections) ? billingStateStore.connections : []
  connections.forEach((c) => {
    const type = billingStateStore.connection_types.find(t => t.id === c.type_id)
    const status = billingStateStore.connection_statuses.find(s => s.id === c.status_id)
    if (type && status) {
      const _c: IConnectionWithType = {
        ...c,
        typeData: toRaw(type),
        statusData: toRaw(status),
        isOpen: false
      }
      data[type.type].push(_c)
    }
  })
  return data
})

function openEdit(item: IConnection) {
  modalStore.EditConnection = item
  modalStore.showModal(ModalEnum.EDIT_CONNECTION)
}

async function deleteConnection(item: IConnection) {
  const data = await $axios.deleteConnection(item.id)
  if (data) {
    const index = billingStateStore.connections.findIndex(c => c.id === item.id)
    if (index > -1) {
      billingStateStore.connections.splice(index, 1)
      toastStore.openToast('Подключение удаленно')
    }
  }
}
</script>

<template>
  <div class="main-page-container">
    <div class="main-info-grid">
      <div
        class="main-info-item any-white-container blue-hover"
        @click="modalStore.showModal(ModalEnum.TARIFF_MODAL)"
      >
        <div>
          <span class="font-semibold select-none">Модули</span>
        </div>
        <div class="flex flex-col">
          <span class="text-2xl cursor-default">Корп</span>
          <span class="text-gray-500 text-sm cursor-default">Общее количество модулей: {{ ModulesCount }}</span>
        </div>
      </div>
      <div class="main-info-item any-white-container">
        <div>
          <span class="font-semibold select-none">Дата создания</span>
        </div>
        <div class="flex flex-col">
          <span class="text-2xl cursor-default">{{ bitrixStateStore.getDateCreate() }}</span>
          <span class="text-gray-500 text-sm cursor-default">Последняя активность:<br>{{ bitrixStateStore.lastActivityCompany() }}</span>
        </div>
      </div>
      <div
        class="main-info-item any-white-container blue-hover"
        @click="modalStore.showModal(ModalEnum.ASSIGN_MODAL)"
      >
        <div>
          <span class="font-semibold select-none">Отвественный</span>
        </div>
        <div
          v-if="bitrixStateStore.companyAssignUser"
          class="flex flex-col"
        >
          <span class="text-2xl cursor-default">{{ bitrixStateStore.getShortName(bitrixStateStore.companyAssignUser) }}</span>
          <span class="text-gray-500 text-sm cursor-default">{{ bitrixStateStore.companyAssignUser?.WORK_POSITION }}</span>
          <span
            class="text-gray-500 text-xs cursor-default"
            style="margin-top: 10px;"
          >Нажмите для просмотра контактов</span>
        </div>
        <div
          v-else
          class="flex flex-col"
        >
          <span class="text-3xl cursor-default">Отсутсвует</span>
        </div>
      </div>
    </div>
    <div class="any-white-container connected-container">
      <div class="flex flex-col gap-1">
        <span class="text-lg select-none">Подключенные модули</span>
        <span class="text-gray-500 text-sm select-none">Активные модули организации</span>
      </div>
      <div
        v-if="modulesComputed.length > 0"
        class="connected-modules-box"
      >
        <div
          v-for="value in modulesComputed"
          class="flex flex-col p-[12px] any-white-container gap-[10px] blue-hover"
        >
          <div
            class="flex items-center gap-[12px]"
            @click="modalStore.showModal(ModalEnum.TARIFF_MODAL)"
          >
            <Icon
              class="text-sky-600 w-5 h-5"
              icon="solar:box-linear"
            />
            <div class="flex flex-col">
              <span>{{ value.title }}</span>
              <span class="text-gray-500 text-xs select-none">Активный</span>
            </div>
          </div>
          <div class="tags-container">
            <div class="tag-box">
              <span class="text-xs font-semibold">Количество проектов: {{ value.count }}</span>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="connected-empty-box"
      >
        <span class="text-gray-500 select-none">Нет активных модулей</span>
      </div>
    </div>
    <div class="connected-container any-white-container gap-5">
      <div class="flex">
        <div class="flex flex-col gap-1 mb-2">
          <span class="select-none font-semibold">Подключенния</span>
          <span class="text-gray-500 select-none">Подключенные аккаунты и сервисы</span>
        </div>
        <div
          class="add-user-btn items-center flex px-3 py-2 gap-1"
          @click="modalStore.showModal(ModalEnum.ADD_CONNECTION)"
        >
          <span class="select-none text-sm text-slate-50 font-semibold">Добавить подключенние</span>
        </div>
      </div>
      <div
        v-if="billingStateStore.connections.length > 0"
        class="flex flex-col gap-[10px] mb-2"
      >
        <div
          v-if="connectionsComputed.messenger.length > 0"
          class="flex flex-col gap-1"
        >
          <span class="text-gray-500 text-sm select-none">Мессенджеры</span>
          <div class="flex flex-col gap-2">
            <div
              v-for="value in connectionsComputed.messenger"
              class="any-white-container connected-item-box"
            >
              <div
                class="messenger-whatsap-container mr-2"
                :class="`messenger-${value.typeData.name}-container`"
              >
                <div
                  :class="`messenger-${value.typeData.name}-char-logo`"
                  class="select-none"
                >
                  {{ value.typeData.name.length > 2 ? value.typeData.name[0]?.toUpperCase() : value.typeData.name }}
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-sm">{{ value.title }}</span>
                <span class="text-gray-500 text-xs ">{{ value.source }}</span>
              </div>
              <div
                class="flex gap-3"
                style="margin-left: auto; align-items: center;"
              >
                <div
                  :class="value.status_id === 1 ? 'any-green-container' : 'any-red-container'"
                  class="flex any-green-container gap-1 py-0.5 px-1.5 items-center"
                  style="height: fit-content;"
                >
                  <Icon
                    :icon="value.status_id === 1 ? 'mdi:success' : 'akar-icons:cross'"
                    :class="value.status_id === 1 ? 'green-container-item' : 'red-container-item '"
                    class="w-3 h-3"
                  />
                  <span
                    :class="value.status_id === 1 ? 'green-container-item' : 'red-container-item'"
                    class="text-xs"
                  >{{ value.statusData.name }}</span>
                </div>
                <DropdownMenuRoot v-model="value.isOpen">
                  <DropdownMenuTrigger>
                    <MoreBox />
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent
                      class="DropdownMenuContent"
                      align="end"
                      :side-offset="5"
                    >
                      <DropdownMenuItem
                        class="drop-down-item blue-hover"
                        @select="openEdit(value)"
                      >
                        <Icon
                          class="w-4 h-4 hover-item"
                          icon="majesticons:open"
                        />
                        <span class="select-none hover-item text-sm">Изменить</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="drop-down-item blue-hover"
                        @select="deleteConnection(value)"
                      >
                        <Icon
                          class="w-4 h-4 hover-item"
                          icon="tabler:trash"
                        />
                        <span class="select-none hover-item text-sm text-red-600">Удалить</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenuRoot>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="connectionsComputed.vats.length > 0"
          class="flex flex-col gap-1"
        >
          <span class="text-gray-500 text-sm select-none">ВАТС</span>
          <div class="flex flex-col gap-2">
            <div
              v-for="value in connectionsComputed.vats"
              class="any-white-container connected-item-box"
            >
              <div class="flex flex-col gap-2">
                <span class="text-sm">{{ value.title }}</span>
                <span class="text-gray-500 text-xs ">{{ value.source }}</span>
              </div>
              <div
                class="flex gap-3"
                style="margin-left: auto; align-items: center;"
              >
                <div
                  :class="value.status_id === 1 ? 'any-green-container' : 'any-red-container'"
                  class="flex any-green-container gap-1 py-0.5 px-1.5 items-center"
                  style="height: fit-content;"
                >
                  <Icon
                    :icon="value.status_id === 1 ? 'mdi:success' : 'akar-icons:cross'"
                    :class="value.status_id === 1 ? 'green-container-item' : 'red-container-item '"
                    class="w-3 h-3"
                  />
                  <span
                    :class="value.status_id === 1 ? 'green-container-item' : 'red-container-item'"
                    class="text-xs"
                  >{{ value.statusData.name }}</span>
                </div>
                <DropdownMenuRoot v-model="value.isOpen">
                  <DropdownMenuTrigger>
                    <MoreBox />
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent
                      class="DropdownMenuContent"
                      align="end"
                      :side-offset="5"
                    >
                      <DropdownMenuItem
                        class="drop-down-item blue-hover"
                        @select="openEdit(value)"
                      >
                        <Icon
                          class="w-4 h-4 hover-item"
                          icon="majesticons:open"
                        />
                        <span class="select-none hover-item text-sm">Изменить</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="drop-down-item blue-hover"
                        @select="deleteConnection(value)"
                      >
                        <Icon
                          class="w-4 h-4 hover-item"
                          icon="tabler:trash"
                        />
                        <span class="select-none hover-item text-sm text-red-600">Удалить</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenuRoot>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="connectionsComputed.sms.length > 0"
          class="flex flex-col gap-1"
        >
          <span class="text-gray-500 text-sm select-none">SMS</span>
          <div class="flex flex-col gap-2">
            <div
              v-for="value in connectionsComputed.sms"
              class="any-white-container connected-item-box"
            >
              <div class="flex flex-col gap-2">
                <span class="text-sm">{{ value.title }}</span>
                <span class="text-gray-500 text-xs ">{{ value.source }}</span>
              </div>
              <div
                class="flex gap-3"
                style="margin-left: auto; align-items: center;"
              >
                <div
                  :class="value.status_id === 1 ? 'any-green-container' : 'any-red-container'"
                  class="flex any-green-container gap-1 py-0.5 px-1.5 items-center"
                  style="height: fit-content;"
                >
                  <Icon
                    :icon="value.status_id === 1 ? 'mdi:success' : 'akar-icons:cross'"
                    :class="value.status_id === 1 ? 'green-container-item' : 'red-container-item '"
                    class="w-3 h-3"
                  />
                  <span
                    :class="value.status_id === 1 ? 'green-container-item' : 'red-container-item'"
                    class="text-xs"
                  >{{ value.statusData.name }}</span>
                </div>
                <DropdownMenuRoot v-model="value.isOpen">
                  <DropdownMenuTrigger>
                    <MoreBox />
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent
                      class="DropdownMenuContent"
                      align="end"
                      :side-offset="5"
                    >
                      <DropdownMenuItem
                        class="drop-down-item blue-hover"
                        @select="openEdit(value)"
                      >
                        <Icon
                          class="w-4 h-4 hover-item"
                          icon="majesticons:open"
                        />
                        <span class="select-none hover-item text-sm">Изменить</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="drop-down-item blue-hover"
                        @select="deleteConnection(value)"
                      >
                        <Icon
                          class="w-4 h-4 hover-item"
                          icon="tabler:trash"
                        />
                        <span class="select-none hover-item text-sm text-red-600">Удалить</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenuRoot>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="connectionsComputed.another.length > 0"
          class="flex flex-col gap-1"
        >
          <span class="text-gray-500 text-sm select-none">Иное</span>
          <div class="flex flex-col gap-2">
            <div
              v-for="value in connectionsComputed.another"
              class="any-white-container connected-item-box"
            >
              <div class="flex flex-col gap-2">
                <span class="text-sm">{{ value.title }}</span>
                <span class="text-gray-500 text-xs ">{{ value.source }}</span>
              </div>
              <div
                class="flex gap-3"
                style="margin-left: auto; align-items: center;"
              >
                <div
                  :class="value.status_id === 1 ? 'any-green-container' : 'any-red-container'"
                  class="flex any-green-container gap-1 py-0.5 px-1.5 items-center"
                  style="height: fit-content;"
                >
                  <Icon
                    :icon="value.status_id === 1 ? 'mdi:success' : 'akar-icons:cross'"
                    :class="value.status_id === 1 ? 'green-container-item' : 'red-container-item '"
                    class="w-3 h-3"
                  />
                  <span
                    :class="value.status_id === 1 ? 'green-container-item' : 'red-container-item'"
                    class="text-xs"
                  >{{ value.statusData.name }}</span>
                </div>
                <DropdownMenuRoot v-model="value.isOpen">
                  <DropdownMenuTrigger>
                    <MoreBox />
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent
                      class="DropdownMenuContent"
                      align="end"
                      :side-offset="5"
                    >
                      <DropdownMenuItem
                        class="drop-down-item blue-hover"
                        @select="openEdit(value)"
                      >
                        <Icon
                          class="w-4 h-4 hover-item"
                          icon="majesticons:open"
                        />
                        <span class="select-none hover-item text-sm">Изменить</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="drop-down-item blue-hover"
                        @select="deleteConnection(value)"
                      >
                        <Icon
                          class="w-4 h-4 hover-item"
                          icon="tabler:trash"
                        />
                        <span class="select-none hover-item text-sm text-red-600">Удалить</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenuRoot>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="h-[100px] flex flex-col justify-center items-center"
      >
        <span class="text-gray-500 select-none">Нет активных подключенний</span>
      </div>
    </div>
  </div>
</template>

<style>
@import '~/assets/css/any-container.css';

.DropdownMenuContent{
  min-width: 120px;
  background-color: white;
  border-radius: 6px;
  padding: 5px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

.drop-down-item{
    display: flex;
    gap: 10px;
    padding: 5px;
    border-radius: 3px;
    align-items: center;
}

.add-user-btn{
    background: #3182ce;
    border-radius: 10px;
    margin-left: auto;
    height: fit-content;
}
.add-user-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}

.main-page-container{
    display: flex;
    flex-direction: column;
    gap: 25px;
}
.main-info-grid{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0,1fr));
    height: 200px;
    width: 100%;
    gap: 25px;
}
.main-info-item{
    display: flex;
    flex-direction: column;
    padding: 24px 24px 0px;
    gap: 16px;
}
.tags-container{
    display: flex;
    flex-wrap: wrap;
    gap: 10px
}
.tag-box{
    padding: 3px 8px;
    display: flex;
    height: fit-content;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #edf2f7;
    border-color: #eaeff5;
    gap: 5px;
    border-width: 1.5px;
}
.connected-container{
    min-height: 240px;
    height: fit-content;
    display: flex;
    flex-direction: column;
    padding: 25px 20px;
}
.connected-modules-box{
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;

}

.connected-empty-box{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
}
.messenger-WhatsApp-container{
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: rgb(230, 250, 238);
    color: rgb(230, 250, 238);
    height: 32px;
    width: 32px;
}
.messenger-VK-container,
.messenger-Max-container{
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: rgb(233, 242, 2558);
    color: rgb(233, 242, 255);
    height: 32px;
    width: 32px;
}
.messenger-Telegram-container{
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background-color: rgba(197, 231, 244, 0.443);
    height: 32px;
    width: 32px;
}
.messenger-VK-char-logo,
.messenger-Max-container{
    color: color-mix(in srgb, currentColor 20%, blue);
}
.messenger-Telegram-char-logo{
    color: color-mix(in srgb, currentColor 20%, rgb(0, 119, 255));
}
.messenger-WhatsApp-char-logo{
    color: color-mix(in srgb, currentColor 15%, green);
}
.connected-item-box{
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding: 12px;
}
.more-box{
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;
    width: 36px;
    border-radius: 6px;
}
.blue-hover:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.blue-hover:hover .hover-item{
    color: #437db4;
    transition: color 0.15s cubic-bezier(0.16, 1, 0.3,);
}
</style>
