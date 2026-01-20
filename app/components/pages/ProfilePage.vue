<script setup lang="ts">
import Cross25Icon from '@bitrix24/b24icons-vue/actions/Cross25Icon'
import OpenIn40Icon from '@bitrix24/b24icons-vue/actions/OpenIn40Icon'
import UploadIcon from '@bitrix24/b24icons-vue/actions/UploadIcon'
import { storeToRefs } from 'pinia'
import useMenuStore from '~/services/stores/menuStores'

const menuStore = useMenuStore()

const { openEditMode, openEditSelector} = storeToRefs(menuStore)



type companyType = {
    name : string,
    inn : string,
    orgrn : string,
    adres : string,
    adren_mail : string
}

let company = reactive({
    name : "ООО 'Техносфера'",
    inn : "7701234567",
    orgrn : '1234567890123',
    adres : 'г. Москва, ул. Примерная, д. 1',
    adren_mail : '127015, г. Москва, ул. Новодмитровская, д. 5А, стр. 4'
} as companyType)

const editCompany = ref<companyType>({
    name : "",
    inn : "",
    orgrn : "",
    adres : "",
    adren_mail : ""
})


function openEditCompany(){
    openEditMode.value.companyInfo = true;
    openEditSelector.value.companyInfo = false;
    editCompany.value = {...company};
}

function saveEditCompany(){
    if(!editCompany.value) return;
    company = {...editCompany.value};
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
            <span v-if="!openEditMode.companyInfo">{{ company.name }}</span>
            <InputBox v-else v-model="editCompany.name" ::rows="1"/>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">ИНН</span>
            <span v-if="!openEditMode.companyInfo">{{ company.inn }}</span>
            <InputBox v-else type="text" v-model="editCompany.inn" :rows="1" class="edit-input"/>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">ОГРН</span>
            <span v-if="!openEditMode.companyInfo">{{ company.orgrn }}</span>
            <InputBox v-else type="text" v-model="editCompany.orgrn" :rows="1" class="edit-input"/>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">Юридический адрес</span>
            <span v-if="!openEditMode.companyInfo">{{ company.adres }}</span>
            <InputBox v-else type="text" v-model="editCompany.adres" :rows="1" class="edit-input"/>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">Адрес почтовой корреспонденции</span>
            <p v-if="!openEditMode.companyInfo">{{ company.adren_mail }}</p>
            <InputBox v-else type="text" v-model="editCompany.adren_mail" :rows="2"  style="width: 201%;"/>
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
        <div class="flex flex-col gap-5">
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
            <div class="bg-gray-300 mt-3" style="width: 100%; height: 1px;"></div>
        </div>
        <div class="flex flex-col gap-5">
            <p class="font-semibold">Бухгалтерия</p>
            <div class="contacts-info-grid">
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">ФИО</span>
                    <span>Иванов Иван Иванович</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Email</span>
                    <span>accounting@technosfera.ru</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Должность</span>
                    <span>Главный бухгалтер</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-gray-500 text-sm">Телефон</span>
                    <span>+7 (495) 123-45-68</span>
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