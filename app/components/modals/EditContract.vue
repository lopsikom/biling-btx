<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { CalendarDate } from '@internationalized/date';
import type { SelectorObject } from '~/services/models';
import usebillingStateStore from '~/services/stores/billingStateStore';
import useBitrixStateStore from '~/services/stores/bitrixStateStore';
import useMenuStore from '~/services/stores/menuStores';
import useModalStore from '~/services/stores/modalStore';
import useToastStore from '~/services/stores/toastStore';
import { copyToClipboard, isValidData } from '~/services/utils/utils';
import type { IContract, IContractPost, IContractUpdate } from '~~/shared/models/APIModels';

const billingStateStore = usebillingStateStore()
const modalStore = useModalStore();
const menuStore = useMenuStore()
const toastStore = useToastStore();
const bitrixStateStore = useBitrixStateStore()
const {$axios} = useNuxtApp()

const {EditContract} = storeToRefs(modalStore)

const contract = ref<Partial<IContract>>({})

const dateBegin = ref<CalendarDate>()
const dateClose = ref<CalendarDate>()
const SelectStatus = ref<SelectorObject>()
const selectStatusItems = computed(() => billingStateStore.contractStatuses.map(c => {return {label : c.id, value : c.name} as SelectorObject}))

onMounted(() => {
    if(!EditContract.value) {modalStore.hideModal(); return}
    contract.value = structuredClone(toRaw(EditContract.value))
    SelectStatus.value = selectStatusItems.value.find(s => s.value === EditContract.value!.status)
    const date1 = new Date(EditContract.value.date_begin)
    dateBegin.value = new CalendarDate(date1.getFullYear(), date1.getMonth() + 1, date1.getDate())
    const date2 = new Date(EditContract.value.date_close);
    dateClose.value = new CalendarDate(date2.getFullYear(), date2.getMonth() + 1, date2.getDate())
})

watch(() => dateBegin.value, () => {
    if(!dateBegin.value || !dateClose.value) return
    if(dateBegin.value.year.toString().length < 4 || dateClose.value.year.toString().length < 4) return
    const begin = new Date(dateBegin.value.year, dateBegin.value.month - 1, dateBegin.value.day)
    const close =new Date(dateClose.value.year, dateClose.value.month - 1, dateClose.value.day)
    if(begin.getTime() > close.getTime()) {
        toastStore.openToast("Неверно введенны даты");
    }
})
watch(() => dateClose.value, () => {
    if(!dateBegin.value || !dateClose.value) return
    if(dateBegin.value.year.toString().length < 4 || dateClose.value.year.toString().length < 4) return
    console.log(dateClose.value.year.toString().length)
    const begin = new Date(dateBegin.value.year, dateBegin.value.month - 1, dateBegin.value.day)
    const close =new Date(dateClose.value.year, dateClose.value.month - 1, dateClose.value.day)
    if(begin.getTime() > close.getTime()) {
        toastStore.openToast("Неверно введенны даты");
    }
})

async function saveData(){
    menuStore.fetchDataLoad = true
    try{
        if(!dateBegin.value || !dateClose.value) throw new Error("Validation Error")
        const begin = new Date(dateBegin.value.year, dateBegin.value.month - 1, dateBegin.value.day)
        const close = new Date(dateClose.value.year, dateClose.value.month - 1, dateClose.value.day)
        const data = {
            name : contract.value.name,
            status : SelectStatus.value?.label,
            index : contract.value.index?.toString(),
            date_begin : `${dateBegin.value.year}-${String(dateBegin.value.month).padStart(2, '0')}-${String(dateBegin.value.day).padStart(2, '0')}T00:00:00.000Z`,
            date_close : `${dateClose.value.year}-${String(dateClose.value.month).padStart(2, '0')}-${String(dateClose.value.day).padStart(2, '0')}T00:00:00.000Z`,
            org_name : contract.value.org_name
        } as IContractPost
        if(begin.getTime() > close.getTime()) throw new Error("Validation Error")
        if(!isValidData(data)) throw new Error("Validation Error")
        const newContract = await $axios.patchContract(data, contract.value.id!)
        const index = billingStateStore.contracts.findIndex(c => c.id === newContract.id)
        if(index > -1) billingStateStore.contracts[index] = newContract
        toastStore.openToast("Данные сохраненны")
        EditContract.value = null;
        modalStore.hideModal();
    }catch(e){
        console.error(e);
        if((e as Error).message === "Validation Error") toastStore.openToast("Не все поля правильно заполнены или заполнены некорректно")
    }finally {menuStore.fetchDataLoad = false}
}

async function deleteData(){
    const data = await $axios.deleteContract(contract.value.id!);
    if(data) toastStore.openToast("Договор успешно удалён");
    else toastStore.openToast("Не удалось удалить договор");
    EditContract.value = null;
    modalStore.hideModal();
}

</script>
<template>
    <div class="flex mb-[35px]">
        <div class="flex flex-col">
            <span class="text-lg font-semibold select-none">Добавление договора</span>
            <span class="text-gray-500 text-sm select-none">добавление договора с указанием данных</span>
        </div>
        <div style="margin-left: auto; margin-top: 5px;"  @click="modalStore.hideModal">
            <Icon  icon="maki:cross"/>
        </div>
    </div>
    <div class="assign-modal">
        <div class="any-white-container p-5 gap-2 flex flex-col" style="width: 100%;">
            <div class="flex">
                <span class="font-semibold mb-[20px] select-none">Поля договора</span>
            </div>
            <div class="flex flex-col gap-3">
                <div class="flex gap-[10px]">
                <InputBox placeholder="Введите название..." v-model="contract.name" :resize="false" title="Название договора" style="width: 50%;">
                </InputBox>
                <InputBox placeholder="Введите номер..." v-model="contract.index" type="number" :resize="false" title="Номер договора" style="width: 50%;">
                </InputBox>
                <Selector v-model="SelectStatus" style="width: 50%;" title="Статус договора" :items="selectStatusItems" />
                </div>
                <InputBox placeholder="Введите название организации..." v-model="contract.org_name" :resize="false" title="Название организация">
                </InputBox>
                <div class="flex gap-[20px]">
                    <DateRangePicker v-model="dateBegin" title="Дата начала"></DateRangePicker>
                    <DateRangePicker v-model="dateClose" title="Дата окончания"></DateRangePicker>
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