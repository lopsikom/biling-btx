<script setup lang="ts">
import Cross25Icon from '@bitrix24/b24icons-vue/actions/Cross25Icon'
import OpenIn40Icon from '@bitrix24/b24icons-vue/actions/OpenIn40Icon'
import UploadIcon from '@bitrix24/b24icons-vue/actions/UploadIcon'
import { storeToRefs } from 'pinia'
import type { Bitrix } from '~/services/bitrix'
import initBitrix from '~/services/bitrix'
import { type IAddress, type IRequisite, type IUser, type ICompnany, type IContact, EmailTypeEnum, PhonelTypeEnum, type DiffAdress, type IEditContacts, type DiffWithID, type IContactInfo } from '~/services/models'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import useMenuStore from '~/services/stores/menuStores'
import { diffArray, diffObject, makeKey } from '~/services/utils/utils'
import InputBox from '../InputBox.vue'
import useToastStore from '~/services/stores/toastStore'

const menuStore = useMenuStore();
const bitrixStateStore = useBitrixStateStore();
const openToast = useToastStore().openToast;

const { openEditMode, openEditSelector} = storeToRefs(menuStore)
const {bitrixCompany, companyAssignUser, companyContacts, companyRequisite, companyAddress} = storeToRefs(bitrixStateStore)

let bitrixClient : Bitrix | undefined = undefined

onMounted(async () => {
    bitrixClient = bitrixStateStore.getBitrixClient();
    if(!bitrixClient){
        const {$initializeB24Frame} = useNuxtApp();
        const frame = await $initializeB24Frame();
        bitrixClient = await initBitrix(frame);
        bitrixStateStore.setBitrixClient(bitrixClient);
    }
});


const editCompany = ref<ICompnany>();
const editRequisite = ref<IRequisite[]>();
const editContacts = ref<IEditContacts[]>();
const editAddress = ref<IAddress[]>();


function diffAdress(oldArray : IAddress[],newArray : IAddress[]) : DiffAdress[]{
    const diff : DiffAdress[] = [];
        newArray.forEach((n , i) => {
        const diffobj = diffObject(oldArray[i]!,n);
        if(diffobj?.ADDRESS_2){
            if(diffobj.ADDRESS_2 === bitrixStateStore.addressesNormalized[i]?.addres){
                delete diffobj.ADDRESS_2;
            }
        }
        if(Object.keys(diffobj!).length > 0) {
            diff.push({
                TYPE_ID : n.TYPE_ID,
                ENTITY_ID : n.ENTITY_ID,
                ENTITY_TYPE_ID : n.ENTITY_TYPE_ID,
                data : diffobj!
            })
        }
    })
    return diff;
}

function openEditCompany(){
    editCompany.value = {...bitrixCompany.value!};
    editRequisite.value = structuredClone(toRaw(companyRequisite.value));
    editAddress.value = structuredClone(toRaw(companyAddress.value));
    editAddress.value?.forEach((a, i) => {
       if(!a.ADDRESS_2 || a.ADDRESS_2.trim() == "") a.ADDRESS_2 = bitrixStateStore.addressesNormalized[i]?.addres
    });
    openEditMode.value.companyInfo = true;
    openEditSelector.value.companyInfo = false;
}

function saveEditCompany(){
    if(editCompany.value?.TITLE.trim() === ""){
        editCompany.value.TITLE = bitrixCompany.value!.TITLE;
    }
    const diffComp = diffObject(bitrixCompany.value!, editCompany.value!);
    const diffReq = diffArray(companyRequisite.value!, editRequisite.value!, "ID");
    const diffAdresses = diffAdress(companyAddress.value!, editAddress.value!)
    if(Object.keys(diffComp!).length > 0){
        console.log(diffComp);
        try{
            bitrixClient?.companyUpdate(diffComp!)
        }catch(e){
            openToast("Ошибка сохранения данных");
            console.log(e)
            return
        }
        bitrixCompany.value = {...editCompany.value!};
    }
    if(diffReq.length > 0){
        console.log(diffReq);
        diffReq.forEach(r => {
            try{
                bitrixClient?.updateRequisite(r.data, r.id)
            }catch(e){
                openToast("Ошибка сохранения данных");
                console.log(e)
                return
            }
        })
        companyRequisite.value = structuredClone(toRaw(editRequisite.value));
    }
    if(diffAdresses.length > 0){
        console.log(diffAdresses)
        diffAdresses.forEach(async a => {
            try{
                if(a.data.ADDRESS_2?.trim() === ''){
                    console.log("adwa")
                    const i = editAddress.value!.findIndex(a2 => a2.TYPE_ID === a.TYPE_ID && a2.ENTITY_ID === a.ENTITY_ID && a2.ENTITY_TYPE_ID && a.ENTITY_TYPE_ID);
                    console.log(i);
                    if (i > -1){
                        console.log(a);
                        console.log(i);
                    }
                    await bitrixClient?.deleteAddress(a)
                    .then(b => {
                        if(b.result){
                            // deletedList.add(makeKey(i!.TYPE_ID.toString(), i!.ENTITY_ID.toString(), i!.ENTITY_TYPE_ID.toString()));
                            editAddress.value?.splice(i, 1);
                        }
                    });                    
                }
                else await bitrixClient?.updateAdress(a);
            }catch(e){
                openToast("Ошибка сохранения данных");
                console.log(e)
                return
            }
        })
        // По возможности решить проблему с structuredClone
        // editAddress.value = toRaw(editAddress.value?.filter(i => {
        //     console.log()
        //     return !deletedList.has(makeKey(i!.TYPE_ID.toString(), i!.ENTITY_ID.toString(), i!.ENTITY_TYPE_ID.toString()));
        // }));
        companyAddress.value = structuredClone(toRaw(editAddress.value));
    }
    openEditMode.value.companyInfo = false;
    openToast("Информация об организации успешно сохранена");
} 
function openEditContacts() {
    editContacts.value = structuredClone(toRaw(companyContacts.value));
    editContacts.value?.forEach((c, i) => {
        c.TITLE_NAME = [
            companyContacts.value![i]?.NAME,
            companyContacts.value![i]?.LAST_NAME,
            companyContacts.value![i]?.SECOND_NAME,
        ].filter(Boolean).join(" ");
    })
    openEditMode.value.userInfo = true;
    openEditSelector.value.usersInfo = false;

}

function saveEditContacts (){
    const mappedEditContacts = toRaw(editContacts.value!).map(c =>{
        const newData = structuredClone(c);
        if(newData.TITLE_NAME){
            if(newData.TITLE_NAME.trim() !== ""){
                const [NAME, LAST_NAME, SECOND_NAME] = newData.TITLE_NAME.split(' ');
                newData.NAME = NAME;
                newData.LAST_NAME = LAST_NAME;
                newData.SECOND_NAME = SECOND_NAME;
                delete newData.TITLE_NAME;
            }
            else{
                delete newData.TITLE_NAME
            }
        }
        
        return newData as IContact;
    })
    const diffCont = diffArray(toRaw(companyContacts.value!), mappedEditContacts, "ID")
    if(diffCont.length > 0){
        diffCont.forEach(c => {
            if(c.data.EMAIL && c.data.EMAIL?.length > 0){
                c.data.EMAIL = c.data.EMAIL.map( e => {
                    const email = e as unknown as DiffWithID<IContactInfo>
                    return{
                        ID : email.id as number,
                        VALUE_TYPE : email.data.VALUE_TYPE,
                        VALUE : email.data.VALUE,
                        TYPE_ID : email.data.TYPE_ID
                    }
                })
            }
            if(c.data.PHONE && c.data.PHONE.length > 0){
                c.data.PHONE = c.data.PHONE.map(p => {
                    const phone = p as unknown as DiffWithID<IContactInfo>;
                    return{
                        ID : phone.id as number,
                        VALUE_TYPE : phone.data.VALUE_TYPE,
                        VALUE : phone.data.VALUE,
                        TYPE_ID : phone.data.TYPE_ID
                    }
                })
            }
            try{
                bitrixClient?.updateContact(c.data, c.id!);
            }catch(e){
                console.log(e)
            }
        })
        companyContacts.value = structuredClone(mappedEditContacts);
    }
    openEditMode.value.userInfo = false;
    openToast("Контактная информация успешно сохранена");
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
                <button class="save-btn items-center flex py-1 px-2 gap-1"  @click="saveEditCompany">
                    <UploadIcon class="w-5.5 h-5.5 text-slate-50" />
                    <span class="select-none text-sm text-slate-50">Сохранить</span>
                </button>
            </div>
        </div>
    </div>
    <div class="company-info-grid">
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">Юридическое название</span>
            <span v-if="!openEditMode.companyInfo">{{ bitrixCompany?.TITLE }}</span>
            <InputBox v-else-if="editCompany" v-model="editCompany.TITLE" :rows="1"/>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">ИНН</span>
            <span v-if="!openEditMode.companyInfo">{{ companyRequisite![0]?.RQ_INN?.trim() !== '' ? companyRequisite![0]?.RQ_INN : 'Отсутсвует'}}</span>
            <InputBox v-else-if="editRequisite" type="text" v-model="editRequisite[0]!.RQ_INN" :rows="1"/>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm">ОГРН</span>
            <span v-if="!openEditMode.companyInfo">{{ companyRequisite![0]?.RQ_OGRN?.trim() !== '' ? companyRequisite![0]?.RQ_OGRN : 'Отсуствует' }}</span>
            <InputBox  v-else-if="editRequisite" type="text" v-model="editRequisite[0]!.RQ_OGRN" :rows="1" />
        </div>
        <!-- Продумать изменение адрессов -->
        <div class="flex flex-col gap-1" v-for="(value, index) in bitrixStateStore.addressesNormalized" :key="index"> 
            <span class="text-gray-500 text-sm">{{ value.title }}</span>
            <span v-if="!openEditMode.companyInfo">{{ value.addres }}</span>
            <InputBox v-else-if="editAddress" type="text" v-model="editAddress[index]!.ADDRESS_2" :rows="1"/>
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
            <div  v-if="!openEditMode.userInfo">
                <MoreBox @click.stop="() => openEditSelector.usersInfo = !openEditSelector.usersInfo" >
                </MoreBox>
                <Transition name="openEditSelector">
                    <div class="menu-edit-container any-white-container" v-if="openEditSelector.usersInfo" @click.stop>
                    <div class="flex gap-2 py-1 px-2 blue-hover" style="border-radius: 10px;" @click.stop="openEditContacts">
                        <OpenIn40Icon class="text-gray-500 w-5 h-5 hover-item" />
                        <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                    </div>
                </div>
                </Transition>
            </div>
            <div class="gap-2 flex" v-else>
                <div class="any-gray-container items-center flex py-1 px-2 gap-1 blue-hover">
                    <Cross25Icon class="w-6 h-6 hover-item"/>
                    <span class="hover-item select-none text-sm" @click="() => openEditMode.userInfo = false">Отменить</span>
                </div>
                <button class="save-btn items-center flex py-1 px-2 gap-1"  @click="saveEditContacts">
                    <UploadIcon class="w-5.5 h-5.5 text-slate-50" />
                    <span class="select-none text-sm text-slate-50">Сохранить</span>
                </button>
            </div>
        </div>
    </div>
    <div class="flex flex-col px-5 mt-5 gap-5">
        <div class="flex flex-col gap-5 pb-5" style="border-bottom: 1px solid #e7eaee;" v-for="(value, index) in companyContacts" :key="index">
            <div class="contacts-info-grid">
                <div class="firt-row-grid">
                    <div class="flex flex-col gap-1">
                        <span class="text-gray-500 text-sm">ФИО</span>
                        <span v-if="!openEditMode.userInfo">{{ value.NAME }} {{ value.LAST_NAME }} {{ value.SECOND_NAME }}</span>
                        <InputBox v-else-if="editContacts" v-model="editContacts[index]!.TITLE_NAME" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-gray-500 text-sm">Должность</span>
                        <span v-if="!openEditMode.userInfo">{{ value.POST ?? "Не указано" }}</span>
                        <InputBox v-else-if="editContacts" v-model="editContacts[index]!.POST" />
                    </div>
                </div>
                <div class="flex flex-col gap-1" v-for="(email, index2) in value.EMAIL" :key="index2">
                    <span class="text-gray-500 text-sm">{{ EmailTypeEnum[email.VALUE_TYPE as keyof typeof EmailTypeEnum ?? "Неопределённая почта"]}}</span>
                    <span v-if="!openEditMode.userInfo">{{ email.VALUE }}</span>
                    <InputBox v-else-if="editContacts && editContacts[index]?.EMAIL" v-model="editContacts[index]!.EMAIL[index2]!.VALUE" />
                </div>
                <div class="flex flex-col gap-1" v-for="(phone, index2 ) in value.PHONE" :key="index2">
                    <span class="text-gray-500 text-sm">{{ PhonelTypeEnum[phone.VALUE_TYPE as keyof typeof PhonelTypeEnum] ?? "Неопределённый телефон"}}</span>
                    <span v-if="!openEditMode.userInfo">{{ phone.VALUE }}</span>
                    <InputBox v-else-if="editContacts && editContacts[index]?.PHONE" v-model="editContacts[index]!.PHONE[index2]!.VALUE" />
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
    gap: 20px;
}
.contacts-info-grid > :nth-child(1){
    grid-column: span 3;
}
.firt-row-grid{
    display: grid;
    gap: 20px;
    grid-template-columns: 1fr 1fr;
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