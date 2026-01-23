<script setup lang="ts">
import Cross25Icon from '@bitrix24/b24icons-vue/actions/Cross25Icon'
import OpenIn40Icon from '@bitrix24/b24icons-vue/actions/OpenIn40Icon'
import UploadIcon from '@bitrix24/b24icons-vue/actions/UploadIcon'
import { storeToRefs } from 'pinia'
import { type IAddress, type IRequisite, type IUser, type ICompnany, type IContact, EmailTypeEnum, PhonelTypeEnum } from '~/services/models'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import useMenuStore from '~/services/stores/menuStores'

const menuStore = useMenuStore();
const bitrixStateStore = useBitrixStateStore();

const { openEditMode, openEditSelector} = storeToRefs(menuStore)
const {bitrixCompany, companyAssignUser, companyContacts, companyRequisite, companyAddress} = storeToRefs(bitrixStateStore)





const editCompany = ref<ICompnany>();
const editRequisite = ref<IRequisite[]>();
const editContacts = ref<IContact[]>();
const editAddress = ref<IAddress[]>();


function openEditCompany(){
    if(!bitrixCompany.value || !companyRequisite.value || !companyAddress.value) return
    editCompany.value = {...bitrixCompany.value};
    editRequisite.value = [...companyRequisite.value];
    editAddress.value = [...companyAddress.value];
    openEditMode.value.companyInfo = true;
    openEditSelector.value.companyInfo = false;
}

function saveEditCompany(){
    if(!editCompany.value || !editRequisite.value || !editAddress.value) return; 
    bitrixCompany.value = {...editCompany.value};
    companyRequisite.value = [...editRequisite.value];
    companyAddress.value = [...editAddress.value]
    openEditMode.value.companyInfo = false;
}



</script>
<template>
<div class="any-white-container flex flex-col gap-5 px-5 py-4">
    <div class="flex" style="width: 100%;">
        <div class="flex flex-col">
            <span class="select-none font-semibold">Информация об организации</span>
            <span class="text-gray-500">Основные данные</span>
        </div>
        <div style="margin-left: auto; position: relative;">
            <div v-if="!openEditMode.companyInfo">
                <MoreBox @click.stop="() => openEditSelector.companyInfo = !openEditSelector.companyInfo" >
                </MoreBox>
                <Transition name="openEditSelector">
                    <div class="menu-edit-container any-white-container" v-show="openEditSelector.companyInfo" @click.stop>
                    <div class="flex gap-2 py-1 px-2 blue-hover" style="border-radius: 10px;" @click.stop="openEditCompany">
                        <OpenIn40Icon class="text-gray-500 w-5 h-5 hover-item" />
                        <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                    </div>
                </div>
                </Transition>
            </div>
            <div class="gap-2 flex" v-else>
                <div class="any-gray-container items-center flex py-1 px-2 gap-1 blue-hover">
                    <Cross25Icon class="w-6 h-6 hover-item"/>
                    <span class="hover-item select-none text-sm" @click="() => openEditMode.companyInfo = false">Отменить</span>
                </div>
                <div class="save-btn items-center flex py-1 px-2 gap-1" @click="saveEditCompany">
                    <UploadIcon class="w-5.5 h-5.5 text-slate-50" />
                    <span class="select-none text-sm text-slate-50">Сохранить</span>
                </div>
            </div>
        </div>
    </div>
    <div class="company-info-grid">
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">Юридическое название</span>
            <span v-if="!openEditMode.companyInfo">{{ bitrixCompany?.TITLE }}</span>
            <InputBox v-else-if="editCompany" v-model="editCompany.TITLE" ::rows="1"/>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">ИНН</span>
            <span v-if="!openEditMode.companyInfo">{{ companyRequisite![0]?.RQ_INN ?? 'Отсутсвует'}}</span>
            <InputBox v-else-if="editRequisite" type="text" v-model="editRequisite[0]!.RQ_INN" :rows="1" class="edit-input"/>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">ОГРН</span>
            <span v-if="!openEditMode.companyInfo">{{ companyRequisite![0]?.RQ_OGRN ?? 'Отсутсвует' }}</span>
            <InputBox  v-else-if="editRequisite" type="text" v-model="editRequisite[0]!.RQ_OGRN" :rows="1" class="edit-input"/>
        </div>
        <!-- Продумать изменение адрессов -->
        <div class="flex flex-col gap-1" v-for="(value, index) in bitrixStateStore.addressesNormalized" :key="index"> 
            <span class="text-gray-500 text-sm">{{ value.title }}</span>
            <span v-if="!openEditMode.companyInfo">{{ value.addres }}</span>
            <InputBox v-else-if="editAddress" type="text" v-model="editAddress[index]!.ADDRESS_2" :rows="1" class="edit-input"/>
        </div>
    </div>
    <!-- Сделать увеличение инпутов -->
</div>
<div class="any-white-container flex flex-col gap 5 px-5 py-4">
    <div class="flex" style="width: 100%;">
        <div class="flex flex-col">
            <span class="select-none">Контактная информация</span>
        </div>
        <div style="margin-left: auto; position: relative;">
            <MoreBox @click.stop="() => openEditSelector.usersInfo = !openEditSelector.usersInfo" >
            </MoreBox>
            <Transition name="openEditSelector">
                <div class="menu-edit-container any-white-container" v-if="openEditSelector.usersInfo" @click.stop>
                <div class="flex gap-2 py-1 px-2 blue-hover" style="border-radius: 10px;" @click.stop="() => {openEditMode.userInfo = true; openEditSelector.usersInfo = false}">
                    <OpenIn40Icon class="text-gray-500 w-5 h-5 hover-item" />
                    <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                </div>
            </div>
            </Transition>
        </div>
    </div>
    <div class="flex flex-col px-5 mt-5 gap-5">
        <!-- <div class="flex flex-col gap-5 pb-5" style="border-bottom: 1px solid #e7eaee;" v-for="(value, index) in companyContacts">
            <p class="font-semibold">Администрация</p>
            <div class="contacts-info-grid">
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">ФИО</span>
                    <span>Сидорова Мария Петровна</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Email</span>
                    <span>ivanov@technosfera.ru</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Должность</span>
                    <span>Генеральный директор</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Телефон</span>
                    <span>+7 (495) 123-45-67</span>
                </div>
            </div>
        </div> -->
        <div class="flex flex-col gap-5 pb-5" style="border-bottom: 1px solid #e7eaee;" v-for="(value, index) in companyContacts" :key="index">
            <div class="contacts-info-grid">
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">ФИО</span>
                    <span>{{ value.LAST_NAME }} {{ value.NAME }} {{ value.SECOND_NAME }}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Должность</span>
                    <span>{{ value.POST ?? "Не указано" }}</span>
                </div>
                <div class="flex flex-col gap-1" v-for="(email, index2) in value.EMAIL" :key="index2">
                    <span class="text-gray-500 text-sm">{{ EmailTypeEnum[email.VALUE_TYPE as keyof typeof EmailTypeEnum ?? "Неопределённая"]}} почта</span>
                    <span>{{ email.VALUE }}</span>
                </div>
                <div class="flex flex-col gap-1" v-for="(phone, index2 ) in value.PHONE" :key="index2">
                    <span class="text-gray-500 text-sm">{{ PhonelTypeEnum[phone.VALUE_TYPE as keyof typeof PhonelTypeEnum] ?? "Неопределённый"}} телефон</span>
                    <span>{{ phone.VALUE }}</span>
                </div>
            </div>
        </div>
    </div>
</div>
</template>
<style scoped>
@import '~/assets/css/any-container.css';
.profile-page-container{
    display: flex;
    flex-direction: column;
    gap: 25px;
}
.company-info-grid{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}
.contacts-info-grid{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}
.menu-edit-container{
    padding: 2px;
    position: absolute;
    top: 80%;
    right: 1%;
    height: fit-content;
    width: fit-content;
}
.save-btn{
    background: #3182ce;
    border-radius: 10px;
}
.save-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}
.blue-hover:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.blue-hover:hover .hover-item{
    color: #437db4;
    transition: color 0.15s cubic-bezier(0.16, 1, 0.3,);
}
.openEditSelector-enter-from{
    opacity: 0;
    transform: translate(20px, -20px) scale(0.9);
}
.openEditSelector-enter-to{
    opacity: 1;
    transform: translate(0, 0) scale(1);
}
.openEditSelector-enter-active{
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);;
}
.openEditSelector-leave-from{
    opacity: 1;
}
.openEditSelector-leave-to{
    opacity: 0;
    transform: translate(20px, -20px) scale(0.9);
}
.openEditSelector-leave-active{
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);;
}

</style>