<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { invoiceStage, invoiceStageEnum } from '~/services/models/enums/bitrix/invoiceStageEnum';
import SearchIcon from '@bitrix24/b24icons-vue/outline/SearchIcon'
import { mockInvoice } from '~/services/mock';
import useBitrixStateStore from '~/services/stores/bitrixStateStore';
import Selector from '../Selector.vue';
import type { InvoiceGrid, SelectorObject } from '~/services/models';

enum currencyEnum{
    "RUB" = "руб.",
    "EUR" = "€",
    "USD" = "$"
}
const bitrixStateStore = useBitrixStateStore();

const isLoad = ref<boolean>(false);


const statusFilter = ref({label : 'none', value : 'Все статусы'})
const statusSelector : SelectorObject[] = Object.entries(invoiceStage).map(([key, value]) => ({
    value : value,
    label : key 
}))
statusSelector.unshift(toRaw(statusFilter.value));

onMounted(async () => {
   try{
     const client = bitrixStateStore.getBitrixClient();
    if(client && !bitrixStateStore.InvoiceGridList){
        bitrixStateStore.companyInvoice = await client.getInvoice();
        const list = await Promise.all(bitrixStateStore.companyInvoice.map(async i =>{
            const assign = await client.getUser(i.assignedById!);
            let assignName : string;
            if(assign.length > 0){
                assignName = [
                    assign[0]?.NAME,
                    assign[0]?.LAST_NAME
                ].filter(Boolean).join(' ');
            }
            else assignName = "Отсуствует";
            return {
                id: i.id.toString(),
                name: i.title,
                assign: assignName,
                oppuration: i.opportunity ?? 0,
                currencyId : i.currencyId,
                status: i.stageId![i.stageId!.length - 1],
                beginDate: i.begindate,
                closeDate: i.closedate
            }   as InvoiceGrid
        }))
        bitrixStateStore.InvoiceGridList = list;
    }
    else{
        if(!bitrixStateStore.InvoiceGridList){
            bitrixStateStore.InvoiceGridList = mockInvoice.map(i => {
            return {
                id: i.id.toString(),
                name: i.title,
                assign: "Иванов Иван",
                oppuration: i.opportunity ?? 0,
                currencyId : i.currencyId,
                status: i.stageId![i.stageId!.length - 1],
                beginDate: i.begindate,
                closeDate: i.closedate
            }   as InvoiceGrid
        })
        }
    }
   }catch(e) {
    console.log(e)

   }
});

</script>
<template>
    <div class="flex flex-col">
        <div class="any-white-container px-5 py-4 flex flex-col">
            <div class="flex flex-col gap-1">
                    <span class="select-none font-semibold">Счета</span>
                    <span class="text-gray-500 select-none">Управление счетами</span>
            </div>
            <div class="flex flex-col">
                <div class="flex mt-5 gap-5">
                    <div class="search-box flex gap-3">
                        <SearchIcon class="w-5.5 h-5.5 text-gray-400" />
                        <textarea type="text"  rows="1" placeholder="Поиск по имени или email..." class="search-input text-sm"></textarea>
                    </div>
                    
                    <div class="flex">
                        <Selector v-model="statusFilter" :items="statusSelector" :width="200"/>
                    </div>
               </div>
        </div>
        <div class="flex items-center font-semibold text-lg
             justify-center h-[200px] select-none" v-if="isLoad">
            <Icon icon="line-md:loading-loop" class="text-blue-600" width="60"/>
        </div>
        <div class="users-list-grid mt-[30px]" v-else-if="bitrixStateStore.InvoiceGridList && bitrixStateStore.InvoiceGridList.length > 0">
                        <div class="users-list-row" style="border-width: 0;">
                            <div class="font-semibold">Имя</div>
                            <div class="font-semibold">Отвественный</div>
                            <div class="font-semibold">Сумма</div>
                            <div class="font-semibold">Статус</div>
                            <div class="font-semibold">Дата выставления</div>
                            <div class="font-semibold">Срок оплаты</div>
                        </div>
                        <div class="users-list-row users-item" v-for="(value, index) in bitrixStateStore.InvoiceGridList" :key="index">
                            <div>{{ value.name }}</div>
                            <div>{{ value.assign }}</div>
                            <div>{{ value.oppuration }} {{ currencyEnum[value.currencyId! as keyof typeof currencyEnum] }}</div>
                            <div>
                                <div class="role-box px-[10px] py-[5px] flex justify-center align-center text-sm select-none status-box" :class="`status-box-${invoiceStageEnum[value.status! as keyof typeof invoiceStageEnum]}`" style="width: fit-content;" >{{ invoiceStage[value.status!] }}</div>
                            </div>
                            <div>{{ new Date(value.beginDate!).toLocaleDateString() }}</div>
                            <div>{{ new Date(value.closeDate!).toLocaleDateString() }}</div>
                        </div>
        </div>
        <div class="flex items-center font-semibold text-lg
         justify-center h-[200px] select-none" v-else>
            Записи отсуствуют
        </div>
    </div>

    </div>
</template>
<style scoped>
    @import '~/assets/css/any-container.css';

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
    grid-template-columns: repeat(6, minmax(max-content, 1fr));
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
    background-color: #3989d1;
    border-color: #e7eaee;
    border-width: 1.5px;
    border-radius: 10px;
    height: 25px;
    gap: 3px;
    border-radius: 5px;
    width: fit-content;
}
.status-box-NEW{
 background-color: #81c4ff;
  -webkit-text-fill-color: black;
}
.status-box-SEND-CLIENT{
 background-color: #3b74a6;
  -webkit-text-fill-color: white;
}
.status-box-PAY{
 background-color: #6ffe82;
 -webkit-text-fill-color: black;
}
.status-box-UNPAY{
 background-color: #fd3d3d;
 -webkit-text-fill-color: white;
}
.users-item:hover{
    background-color: #ebf8ff;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.users-item:hover{
    background-color: #ebf8ff;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
</style>