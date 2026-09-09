<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { CalendarDate } from '@internationalized/date';
import type { SelectorObject } from '~/services/models';
import usebillingStateStore from '~/services/stores/billingStateStore';
import useBitrixStateStore from '~/services/stores/bitrixStateStore';
import useMenuStore from '~/services/stores/menuStores';
import useModalStore from '~/services/stores/modalStore';
import useToastStore from '~/services/stores/toastStore';
import { isValidData } from '~/services/utils/utils';
import type { IConnection, IConnectionPost, IContractPost } from '~~/shared/models/APIModels';

const billingStateStore = usebillingStateStore()
const modalStore = useModalStore();
const toastStore = useToastStore();
const menuStore = useMenuStore()
const bitrixStateStore = useBitrixStateStore()
const {$axios} = useNuxtApp()

const connection = ref<Partial<IConnection>>({})


const SelectStatus = ref<SelectorObject>()
const selectStatusItems = computed(() => billingStateStore.connection_statuses.map(c => {return {label : c.id, value : c.name} as SelectorObject}))
const SelectType = ref<SelectorObject>();
const selectTypeItems = computed(() => billingStateStore.connection_types.map(c => {return {label : c.id, value : c.name} as SelectorObject}))


async function saveData(){
    menuStore.fetchDataLoad = true
    try{
        const data = {
            title : connection.value.title,
            status_id : SelectStatus.value?.label,
            type_id : SelectType.value?.label,
            source : connection.value.source,
        } as IConnectionPost
        if(!isValidData(data)) throw new Error("Validation Error")
        const newConnection = await $axios.postConnection(data)
    
        billingStateStore.connections.push(newConnection)
        
        toastStore.openToast("Данные сохраненны")
        modalStore.hideModal();
    }catch(e){
        console.error(e);
        if (e instanceof Error && e.message === "Validation Error") {
            toastStore.openErrorToast("Не все поля заполнены или заполнены некорректно")
        }
    }finally {menuStore.fetchDataLoad = false}
}

</script>
<template>
    <div class="flex mb-[35px]">
        <div class="flex flex-col">
            <span class="text-lg font-semibold select-none">Добавление подключения</span>
            <span class="text-gray-500 text-sm select-none">добавление подключения с указанием данных</span>
        </div>
        <div style="margin-left: auto; margin-top: 5px;"  @click="modalStore.hideModal">
            <Icon  icon="maki:cross"/>
        </div>
    </div>
    <div class="assign-modal">
        <div class="any-white-container p-5 gap-2 flex flex-col" style="width: 100%;">
            <div class="flex">
                <span class="font-semibold mb-[20px] select-none">Поля подключения</span>
            </div>
            <div class="flex flex-col gap-3">
                <InputBox placeholder="Введите название подключения..." v-model="connection.title" :required="true" :resize="false" title="Название подключения">
                </InputBox>
                <div class="flex gap-[10px]">
                <InputBox placeholder="Введите источник..." v-model="connection.source" :required="true" :resize="false" title="Источник" style="width: 50%;">
                </InputBox>
                <Selector v-model="SelectType" style="width: 50%;" title="Тип подключения" :required="true" :items="selectTypeItems" />
                <Selector v-model="SelectStatus" style="width: 50%;" title="Статус подключения" :required="true" :items="selectStatusItems" />
                </div>
            </div>
        </div>
    </div>
    <div class="flex mt-[35px] gap-[20px]" style="margin-left: auto; width: 50%; flex-direction: row-reverse;">
            <div class="save-btn justify-center items-center px-[10px] py-[8px]" @click="saveData()">
                <p class="select-none text-sm" style="color: white;">Сохранить</p>
            </div>
            <div class="close-btn blue-hover justify-center items-center px-[10px] py-[8px]" @click="modalStore.hideModal()">
                <p class="select-none hover-item text-sm">Отмена</p>
            </div>
        </div>
</template>
<style scoped>
@import '~/assets/css/any-container.css';
.save-btn{
    background: #3182ce;
    border-radius: 5px;
}
.close-btn{
    border-color: #e7eaee;
    border-width: 1.5px;
    border-radius: 5px;
}
.assign-modal{
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    height: 100%;
}
.info-grid{
    display: grid;
    grid-template-columns: 150px 1fr;
}
.deactive-user{
    position: absolute;
    right: 5%;
    bottom: 5%;
    border-radius: 50%;
    height: 10px;
    width: 10px;
    background-color: red;
}
.active-user{
    position: absolute;
    right: 5%;
    bottom: 5%;
    border-radius: 50%;
    height: 10px;
    width: 10px;
    background-color: green;
}
.hover-box:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.hover-box:hover .hover-item{
    color: #437db4;
    transition: color 0.15s ease;
}
.blue-hover:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.save-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}

</style>