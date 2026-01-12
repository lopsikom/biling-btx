<script setup lang="ts">
import type { ICompnany } from '@models'
import { Bitrix } from '~/services/bitrix'


const {data, pending, error} = await useAsyncData('bitrix', async () => {
    const frame = await useNuxtApp().$initializeB24Frame()
    const bitrix = new Bitrix(frame)
    const Company = await bitrix.companyInfo()
    debugger
    return {bitrix, Company}
})

const bitrix = computed(() => data.value?.bitrix)
const Company = computed(() => data.value?.Company)



</script>
<template>
    <div class="app-container">
        <div class=title-container>
            <p style="font-size: 1.2em;">{{ Company?.TITLE }}</p>
            <p style="font-size: 0.9em; color: gray;">{{ Company?.TITLE }}</p>
        </div>
        <div class="billing-container">
                <div style="display: flex; flex-direction: column; gap:10px">
                    <DataInput :default="Company?.TITLE" title="Название"></DataInput>
                    <DataInput :default="Company?.REVENUE?.toString()" title="Оборот"></DataInput>
                    <DataInput :default="Company?.ADDRESS"  title="Адрес"></DataInput>
                </div>
                <!-- <div style="display: flex; flex-direction: column; gap:10px">
                    <DataInput :title="company.title"></DataInput>
                    <DataInput :title="company.revenue"></DataInput>
                    <DataInput :title="company.adres"></DataInput>
                </div> -->
        </div>
    </div>
</template>
<style scoped>
.app-container{
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 3%;
}
.billing-container{
    border-radius: 50px;
    padding: 20px 10px 20px 10px;
    display: flex;
    flex: 1;
    gap: 10px;
}
.title-container{
    border-bottom: 1px solid rgba(0,0,0, 0.16);
    height: fit-content;
    width: 100%;
    display: flex;
    flex-direction: column;
    }
.main-field-container{
    display: grid;
    grid-template-columns: repeat(2, 0.5fr);
    gap: 10px;
}
</style>