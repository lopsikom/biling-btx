<script setup lang="ts">
import { Icon } from '@iconify/vue';
import useBitrixStateStore from '~/services/stores/bitrixStateStore';
import useModalStore from '~/services/stores/modalStore';
import { copyToClipboard } from '~/services/utils/utils';

const BitrixStore = useBitrixStateStore();
const modalStore = useModalStore();


</script>
<template>
    <div class="flex mb-[35px]">
        <div class="flex flex-col">
            <span class="text-lg font-semibold select-none">Ответственный сотрудник</span>
            <span class="text-gray-500 text-sm select-none">Контактная информация и режим работы</span>
        </div>
        <div style="margin-left: auto; margin-top: 5px;"  @click="modalStore.hideModal">
            <Icon  icon="maki:cross"/>
        </div>
    </div>
    <div class="assign-modal">
        <div class="any-white-container p-5 gap-3 flex items-center" style="width: 100%;">
            <AvatarRoot style="position: relative;">
                <AvatarImage :src="BitrixStore.companyAssignUser?.PERSONAL_PHOTO ?? ''" class="w-12 h-12" style="border-radius: 50%;"/>
                <AvatarFallback>
                    <div class="flex items-center justify-center  w-12 h-12" style="border-radius: 50%; background-color: #eaf2fa;">
                        <Icon icon="lucide:user" class="w-7 h-7 text-sky-600"/>
                    </div>
                </AvatarFallback>
                <div :class="BitrixStore.companyAssignUser?.IS_ONLINE === 'N' ? 'deactive-user' : 'active-user'"></div>
            </AvatarRoot>
            <div class="flex flex-col">
                <span>{{ BitrixStore.getShortName(BitrixStore.companyAssignUser)}}</span>
                <span class="text-gray-500 text-sm">{{ BitrixStore.companyAssignUser?.WORK_POSITION }}</span>
            </div>
        </div>
        <div class="any-white-container p-5 gap-2 flex flex-col" style="width: 100%;">
            <span class="font-semibold mb-[20px] select-none">Контактные данные</span>
            <div class="flex flex-col gap-3">
                <div class="info-grid" v-if="BitrixStore.companyAssignUser?.EMAIL">
                    <span class="text-gray-500 select-none">Email:</span>
                    <div class="flex items-center gap-2">
                        <span>{{BitrixStore.companyAssignUser.EMAIL}}</span>
                        <div class="hover-box" style="border-radius: 5px; width: fit-content; height: fit-content; padding: 5px;">
                            <Icon icon="lucide:copy" class="hover-item" @click="copyToClipboard( BitrixStore.companyAssignUser.EMAIL)"/>
                        </div>
                    </div>
                </div>
                <div class="info-grid" v-if="BitrixStore.companyAssignUser?.WORK_PHONE">
                    <span class="text-gray-500 select-none">Рабочий номер:</span>
                    <div class="flex items-center gap-2">
                        <span>{{ BitrixStore.companyAssignUser.WORK_PHONE }}</span>
                        <div class="hover-box" style="border-radius: 5px; width: fit-content; height: fit-content; padding: 5px;">
                            <Icon icon="lucide:copy" class="hover-item" @click="copyToClipboard( BitrixStore.companyAssignUser.WORK_PHONE)"/>
                        </div>
                     </div>
                </div>
                <div class="info-grid" v-if="BitrixStore.companyAssignUser?.PERSONAL_PHONE">
                    <span class="text-gray-500 select-none">Личный номер:</span>
                    <div class="flex items-center gap-2">
                        <span>{{BitrixStore.companyAssignUser.PERSONAL_PHONE }}</span>
                        <div class="hover-box" style="border-radius: 5px; width: fit-content; height: fit-content; padding: 5px;">
                            <Icon icon="lucide:copy" class="hover-item" @click="copyToClipboard(BitrixStore.companyAssignUser.PERSONAL_PHONE)"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
@import '~/assets/css/any-container.css';
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
</style>