<script setup lang="ts">
import UserIcon from '@bitrix24/b24icons-vue/common-b24/UserIcon'
import SearchIcon from '@bitrix24/b24icons-vue/outline/SearchIcon'
import { SelectItem } from 'reka-ui'
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import type { SelectorObject } from '~/services/models'
import useModalStore from '~/services/stores/modalStore'
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum'
import type { IContract } from '~~/shared/models/APIModels'
import useToastStore from '~/services/stores/toastStore'


const billingStateStore = usebillingStateStore()
const modalStore = useModalStore()
const toastStore = useToastStore()
const {$axios} = useNuxtApp()
const countContracts = ref<number>(0)
const limitPagination = ref<number>(10);
const isLoad = ref<boolean>(false);
const search = ref<string>()
const RoleItems = computed(() => {
    const a = billingStateStore.contractStatuses.map(c => {return {label : c.id, value : c.name} as SelectorObject})
    a.push({label : 0, value : "Все Статусы"})
    return a
})
const RoleMenuValue = ref<SelectorObject>({label : 0, value : "Все Статусы"})

function openEdit(item : IContract){
    modalStore.EditContract = item;
    modalStore.showModal(ModalEnum.EDIT_CONTRACT)
}

const pagePagination = ref(1)

async function getContractPagination(){
    isLoad.value = true;
    try{
        const data = await $axios.getContracts({
            pagination :{
                skip : (pagePagination.value - 1) * limitPagination.value,
                limit : limitPagination.value
            }
        })
        countContracts.value = data.count;
        billingStateStore.contracts = data.data;
    }catch(e){
        console.error(e);
        toastStore.openToast("Ошибка получения событий");
    }finally {isLoad.value = false}
}

onMounted(async () => {
    await getContractPagination();
})

watch(() => pagePagination.value, async () => await getContractPagination())

</script>
<template>
    <div class="flex flex-col">
        <div class="any-white-container px-5 py-4 flex flex-col h-[800px]">
            <div class="flex">
                <div class="flex flex-col gap-1">
                    <span class="select-none font-semibold">Договора</span>
                    <span class="text-gray-500">Управление договорами организации</span>
                </div>
                <div class="add-user-btn items-center flex px-2 py-2 gap-1" @click="modalStore.showModal(ModalEnum.ADD_CONTRACT)">
                    <Icon icon="basil:document-solid" class="w-5 h-5 text-slate-50" />
                    <span class="select-none text-sm text-slate-50 font-semibold">Добавить договор</span>
                </div>
            </div>
                <div class="flex mt-5 gap-5">
                    <div class="search-box flex gap-3">
                        <SearchIcon class="w-5.5 h-5.5 text-gray-400" />
                        <textarea type="text" v-model="search" rows="1" placeholder="Поиск по названию..." class="search-input text-sm"></textarea>
                    </div>
                    
                    <div class="flex">
                        <Selector v-model="RoleMenuValue" :items="RoleItems" :width="200"/>
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
                <div class="h-[72%]">
                    <div class="flex flex-col h-[100%]" v-if="(countContracts && countContracts > 0) || isLoad">
                        <div class="flex items-center font-semibold text-lg
                            justify-center h-[100%] select-none" v-if="isLoad">
                            <Icon icon="line-md:loading-loop" class="text-blue-600" width="60"/>
                        </div>
                        <div class="users-list-grid mt-[30px]" v-else>
                            <div class="users-list-row h-[50px]" style="border-width: 0;">
                                <div class="font-semibold">Имя</div>
                                <div class="font-semibold">Организация</div>
                                <div class="font-semibold">Статус</div>
                                <div class="font-semibold">Дата начала</div>
                                <div class="font-semibold">Дата конца</div>
                            </div>
                            <div style="overflow-y: auto;">
                                <div v-for="(value, index) in billingStateStore.contracts" :key="index" >
                                    <div class="users-list-row users-item" @click="openEdit(value)">
                                        <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ value.name }} {{value.index }}</p>
                                        <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ value.org_name }}</p>
                                        <div >
                                            <div class="any-white-container role-box px-[10px] py-[2px] flex justify-center align-center text-sm" style="width: fit-content;" >{{ value.status }}</div>
                                        </div>
                                        <div>{{ new Date(value.date_begin).toLocaleDateString() }}</div>
                                        <div>{{ new Date(value.date_close).toLocaleDateString() }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center font-semibold text-lg
                        justify-center h-[100%] select-none" v-else>
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
    margin-left: auto;
    height: fit-content;
}
.add-user-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
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
    
    display: grid;
    grid-auto-rows: auto;
    width: 100%;
}
.users-list-row{
    display: grid;
    grid-template-columns: repeat(5, minmax(200px, 1fr));
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