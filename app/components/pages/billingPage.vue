<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { invoiceStage, invoiceStageEnum } from '~/services/models/enums/bitrix/invoiceStageEnum';
import SearchIcon from '@bitrix24/b24icons-vue/outline/SearchIcon'
import { mockInvoice } from '~/services/mock';
import useBitrixStateStore from '~/services/stores/bitrixStateStore';

const bitrixStateStore = useBitrixStateStore();

enum currencyEnum{
    "RUB" = "руб.",
    "EUR" = "евро",
    "USD" = "$"
}

const statusFilter = ref({value : 'none', label : 'Все статусы'})
const statusSelector = Object.entries(invoiceStage).map(([key, value]) => ({
    value : key,
    label : value 
}))
statusSelector.unshift(toRaw(statusFilter.value));

</script>
<template>
    <div class="flex flex-col">
        <div class="any-white-container px-5 py-4 flex flex-col">
            <div class="flex flex-col gap-1">
                    <span class="select-none font-semibold">Счета</span>
                    <span class="text-gray-500">Управление пользователями организации</span>
            </div>
            <div class="flex flex-col">
                <div class="flex mt-5 gap-5">
                    <div class="search-box flex gap-3">
                        <SearchIcon class="w-5.5 h-5.5 text-gray-400" />
                        <textarea type="text"  rows="1" placeholder="Поиск по имени или email..." class="search-input text-sm"></textarea>
                    </div>
                    
                    <div class="flex">
                        <SelectRoot v-model="statusFilter">
                        <SelectTrigger class="select-menu text-gray-600 text-sm" >
                            <SelectValue />
                            <Icon icon="radix-icons:chevron-down" style="margin-left: auto;"/>
                        </SelectTrigger>
                        <SelectContent  :side-offset="2" class="p-[5px]" style="background:  white; border-color: #e7eaee; border-width: 1.5px; border-radius: 10px;" position="popper">
                                <SelectViewport>
                                    <SelectItem v-for="(value, index) in statusSelector" :key="index" :value="value" class="select-item">
                                        <SelectItemText class="text-gray-700 select-title">{{ value.label }}</SelectItemText>
                                        <SelectItemIndicator style="margin-left: auto; ">
                                            <Icon icon="radix-icons:check" class="text-gray-600"/>
                                        </SelectItemIndicator>
                                    </SelectItem>
                                </SelectViewport>
                            </SelectContent>
                    </SelectRoot>
                    </div>
               </div>
        </div>
        <div class="users-list-grid mt-[30px]">
                        <div class="users-list-row" style="border-width: 0;">
                            <div class="font-semibold">Имя</div>
                            <div class="font-semibold">Сделка</div>
                            <div class="font-semibold">Сумма</div>
                            <div class="font-semibold">Статус</div>
                            <div class="font-semibold">Дата выставления</div>
                            <div class="font-semibold">Срок оплаты</div>
                        </div>
                        <div class="users-list-row users-item" v-for="(value, index) in bitrixStateStore.companyInvoice" :key="index">
                            <div>{{ value.title }}</div>
                            <div>52</div>
                            <div>{{ value.opportunity }} {{ currencyEnum[value.currencyId! as keyof typeof currencyEnum] }}</div>
                            <div>
                                <div class="any-white-container role-box px-[10px] py-[2px] flex justify-center align-center text-sm" :class="`status-box-${invoiceStageEnum[value.stageId! as keyof typeof invoiceStageEnum]}`" style="width: fit-content;" >{{ invoiceStage[value.stageId!] }}</div>
                            </div>
                            <div>{{ new Date(value.begindate!).toLocaleDateString() }}</div>
                            <div>{{ new Date(value.closedate!).toLocaleDateString() }}</div>
                        </div>
        </div>
    </div>

    </div>
</template>
<style>
    @import '~/assets/css/any-container.css';
    .select-menu{
    display: inline-flex;
    align-items: center;
    padding: 5px 15px;
    background-color: #edf2f7;
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 0, 0);
    width: 200px;
}
.select-menu:focus{
    outline: none;
}

.select-content{
    overflow: hidden;
    background: white;
    border-radius: 6px;

}
.select-item{
    font-size: 13px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    height: 30px;
    min-width: 190px;
    padding: 0 10px 0 10px;
    position: relative;
    user-select: none;
}
.select-item[data-highlighted]{
    outline: none;
    background-color: #ebf8ff;
    transition: background-color 0.05s ease;
}
.select-item[data-highlighted] .select-title{
    color: #437db4;
    transition: color 0.05s ease;
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
    padding: 2px 8px;
    height: 22px;
    gap: 3px;
    border-radius: 5px;
    width: fit-content;
}
.status-box-NEW{
 background-color: #66b0f0;
  -webkit-text-fill-color: black;
}
.status-box-SEND-CLIENT{
 background-color: #3b74a6;
  -webkit-text-fill-color: black;
}
.status-box-PAY{
 background-color: #3fff59;
 -webkit-text-fill-color: black;
}
.status-box-UNPAY{
 background-color: #f30000;
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