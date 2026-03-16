<script setup lang="ts">
import SearchIcon from '@bitrix24/b24icons-vue/outline/SearchIcon'
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import useModalStore from '~/services/stores/modalStore'
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum'
import Selector from '../Selector.vue'
import { PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from 'reka-ui'
import { entityType, EventType, type IEvent } from '~~/shared/models/APIModels'
import useToastStore from '~/services/stores/toastStore'


const billingStateStore = usebillingStateStore()
const eventSource = ref<string[]>(["События биллинга", "События сделок"])
const RoleItems = ref<string[]>(["dawdaw", "dawdwa"])
const RoleMenuValue = ref<string>()
const eventSourceValue = ref<string>("События биллинга")
const search = ref<string>()
const toastStore = useToastStore()
const {$axios} = useNuxtApp()
const eventsList = ref<IEvent[]>()
const countEvent = ref<number>();
const limitPagination = ref<number>(10);
const isLoad = ref<boolean>(false)

const ActionRecord : Record<string, string> = {
    [EventType.CREATE] : "Добавление",
    [EventType.DELETE] : "Удаление",
    [EventType.UPDATE] : "Изменение"
}

const EntityRecord : Record<string, string> = {
    [entityType.CONNECTION] : "подключенияе",
    [entityType.AUTOINFORMATION] : "модуля автоинформирования",
    [entityType.CHAT_BOT] : "чат бота",
    [entityType.CONTRACT] : "договора",
    [entityType.VATS] : "ВАТС",
    [entityType.VOICE_ROBOT] : "голосового робота",
    [entityType.WEBFORM] : "вебформы"
}

async function getEventPagination(){
    isLoad.value = true
    try{
        const data = await $axios.getEvents({
        pagination : {
            skip : (pagePagination.value - 1) * limitPagination.value,
            limit : limitPagination.value
        }
        })
        eventsList.value = data.data;
        countEvent.value = data.count;
    }catch(e){
        console.error(e);
        toastStore.openToast("Ошибка получения событий");
    }finally{
        isLoad.value = false;
    }
}

onMounted(async () => {
    await getEventPagination()
})

const pagePagination = ref(1)

watch(() => pagePagination.value, async () => {
    await getEventPagination()
})

</script>
<template>
    <div class="flex flex-col">
        <div class="any-white-container px-5 py-4 flex flex-col h-[790px]">
            <div class="flex">
                <div class="flex flex-col gap-1">
                    <span class="select-none font-semibold">События</span>
                    <span class="text-gray-500">Список событий организации</span>
                </div>
            </div>
            <div class="flex mt-5 gap-5">
                <div class="search-box flex gap-3">
                    <SearchIcon class="w-5.5 h-5.5 text-gray-400" />
                    <textarea type="text" v-model="search" rows="1" placeholder="Поиск по названию..." class="search-input text-sm"></textarea>
                </div>
                
                <div class="flex">
                    <Selector v-model="eventSourceValue" :items="eventSource" :width="200"/>
                </div>
                <div class="flex">
                    <Selector v-model="RoleMenuValue" :items="RoleItems" :width="200"/>
                </div>
            </div> 
            <div class="flex mt-[15px] gap-5">
                <div class="flex">
                    <Selector v-model="RoleMenuValue" :items="RoleItems" :width="200"/>
                </div>
                <div class="flex">
                   <Selector v-model="RoleMenuValue" :items="RoleItems" :width="200"/>
                </div>
            </div>
            <div class="flex flex-col h-[100%]" v-if="(countEvent && countEvent > 0) || isLoad">
                            <div class="flex items-center font-semibold text-lg
                    justify-center h-[100%] select-none" v-if="isLoad">
                    <Icon icon="line-md:loading-loop" class="text-blue-600" width="60"/>
                </div>
                    <div class="users-list-grid mt-[30px]" v-else>
                        <div class="users-list-row" style="border-width: 0;">
                            <div class="font-semibold">Сотрудник</div>
                            <div class="font-semibold">Действие</div>
                            <div class="font-semibold">Описание</div>
                            <div class="font-semibold">Время</div>
                        </div>
                        <div  v-for="(value, index) in eventsList" :key="index" >
                            <div class="users-list-row users-item">
                                <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ value.user_bitrix.name }} {{ value.user_bitrix.last_name }} {{ value.user_bitrix.second_name }}</p>
                                <div >
                                    <div class="any-white-container role-box px-[10px] py-[2px] flex justify-center align-center text-sm" :class="`type-box-${value.action}`" style="width: fit-content;" >{{ ActionRecord[value.action] ?? value.action }}</div>
                                </div>
                                <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ ActionRecord[value.action] ?? value.action }} {{ EntityRecord[value.entity] ?? value.entity }} {{ value.entityName ? `с названием ${value.entityName}` : ''  }}</p>
                                <div>{{ new Date(value.createdAt).toLocaleDateString() }} : {{ new Date(value.createdAt).toLocaleTimeString() }}</div>
                            </div>
                        </div>
                    </div>
                    
                    <PaginationRoot
                        v-model:page="pagePagination"
                        :total="countEvent"
                        :sibling-count="2"
                        :items-per-page="10"
                        show-edges
                        :default-page="1"
                        style="margin-top: auto;">
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
                <div class="flex items-center font-semibold text-lg
                justify-center h-[100%] select-none" v-else>
                    Записи отсуствуют
                </div>
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

.Button:disabled {
  opacity: .5
}

.Button:hover{
  background-color: white
}

.type-box-create{
 background-color: #9cd1ff;
  -webkit-text-fill-color: rgb(13, 12, 12);
}
.type-box-update{
 background-color: #3b74a6;
  -webkit-text-fill-color: white;
}
.type-box-PAY{
 background-color: #6ffe82;
 -webkit-text-fill-color: black;
}
.type-box-delete{
 background-color: #fd3d3d;
 -webkit-text-fill-color: white;
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


.search-box{
    padding: 7px 10px;
    background-color: #edf2f7;
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 0, 0);
    width: 60%;
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
.users-list-grid{
    overflow-x:auto ;
    display: grid;
    grid-auto-rows: auto;
    width: 100%;
}
.users-list-row{
    display: grid;
    grid-template-columns: 220px 150px 1fr 250px;
    overflow-x: auto;
    align-items: center;
    gap: 10px;
    border-top: 1px solid #d1d5db;
    padding: 10px 5px 10px 5px;
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