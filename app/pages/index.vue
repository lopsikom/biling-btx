<script setup lang="ts">
import type { ICompnany } from '~/services/models'
import initBitrix, { Bitrix } from '~/services/bitrix'
import ArrowLeftSIcon from '@bitrix24/b24icons-vue/outline/ArrowLeftSIcon'
import Plus30Icon from '@bitrix24/b24icons-vue/actions/Plus30Icon'
import SuccessIcon from '@bitrix24/b24icons-vue/button/SuccessIcon'
import OpenIn40Icon from '@bitrix24/b24icons-vue/actions/OpenIn40Icon'
import BoxIcon from '@bitrix24/b24icons-vue/outline/BoxIcon'
import KeyIcon from '@bitrix24/b24icons-vue/outline/KeyIcon'
import EditPencilIcon from '@bitrix24/b24icons-vue/main/EditPencilIcon'
import MainPage from '~/components/pages/MainPage.vue'
import ProfilePage from '~/components/pages/ProfilePage.vue'
import UsersPage from '~/components/pages/UsersPage.vue'
import BillingPage from '~/components/pages/billingPage.vue'
import EventsPage from '~/components/pages/eventsPage.vue'
import FieldsPage from '~/components/pages/FieldsPage.vue'
import { bilingPagesEnum } from '~/services/models'
import useMenuStore from '~/services/stores/menuStores'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import { mockAddress, mockAddressTypes, mockCompany, mockContact, mockInvoice, mockRequisite, mockUser } from '~/services/mock'
import { Icon } from '@iconify/vue'
import useModalStore from '~/services/stores/modalStore'
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum'
import AssignUserModal from '~/components/AssignUserModal.vue'

const menuStore = useMenuStore()
const bitrixStateStore = useBitrixStateStore()
const modalStore = useModalStore();

const pages = {
    [bilingPagesEnum.Main] : MainPage,
    [bilingPagesEnum.Profile] : ProfilePage,
    [bilingPagesEnum.Users] : UsersPage,
    [bilingPagesEnum.Billing] : BillingPage,
    [bilingPagesEnum.Events] : EventsPage
};

const modalsEnum = {
    [ModalEnum.ASSIGN_MODAL] : AssignUserModal
}

const selectPage = ref<string>(bilingPagesEnum.Main);


const {data, pending, error} = useAsyncData('bitrix', async () => {
    menuStore.fetchDataLoad = true
    try{
        const bitrix = await initBitrix();
        bitrixStateStore.setBitrixClient(bitrix);
        bitrixStateStore.bitrixCompany = await bitrix.companyInfo();
        bitrixStateStore.companyContacts = await bitrix.companyContacts();
        bitrixStateStore.companyRequisite = await bitrix.companyRequisite();
        bitrixStateStore.addresTypes = await bitrix.getAddresTypes();
        bitrixStateStore.companyAddress = await bitrix.companyAdress();
        bitrixStateStore.companyAssignUser = (await bitrix.getUser(bitrixStateStore.bitrixCompany.ASSIGNED_BY_ID))[0];
        bitrixStateStore.companyInvoice = await bitrix.getInvoice();
        return {bitrix, Company}
    }catch(e){
        console.error(e)
        if(useNuxtApp().$config.public.dev){
            bitrixStateStore.bitrixCompany = mockCompany;
            bitrixStateStore.companyRequisite = mockRequisite;
            bitrixStateStore.companyContacts = mockContact;
            bitrixStateStore.companyAssignUser = mockUser;
            bitrixStateStore.addresTypes = mockAddressTypes;
            bitrixStateStore.companyAddress = mockAddress;
            bitrixStateStore.companyInvoice = mockInvoice;
        }
        return
    }finally{
        menuStore.fetchDataLoad = false;
    }
}, { server: false}
)



const Company = computed(() => bitrixStateStore.bitrixCompany)
const Contacts = computed(() => bitrixStateStore.companyContacts)
const Requisite = computed(() => bitrixStateStore.companyRequisite)
const AssignUser = computed(() => bitrixStateStore.companyAssignUser)



function switchPage(page : string){
    selectPage.value = page;
};

</script>
<template>
        <DialogRoot  :open="modalStore.openModal">
        <DialogPortal>
            <DialogOverlay class="modal-overlay" />
            <DialogContent v-if="modalStore.openModal" class="modal-content any-white-container">
                <component v-if="modalStore.modalID" :is="modalsEnum[modalStore.modalID]"></component>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
    <div class="app-container" @click="menuStore.closeAllMenu">
        <div class="billing-container">
            <div class="title-container">
                <div class="back-arrow-box">
                    <ArrowLeftSIcon class="w-6 h-6 back-arrow-svg" />
                </div>
                <div class="any-contaier-column" style="gap: 15px;">
                    <div class="any-contaier-row" style="gap: 10px">
                        <p class="company-title">{{ Company?.TITLE }}</p>
                        <div class="status-box">
                            <SuccessIcon class="w-4 h-4" style="color: white;" />
                            <p class="status-title select-none">Активна</p>
                        </div>
                    </div>
                    <div class="any-contaier-row" style="gap: 15px">
                        <div class="tag-box">
                            <span style="font-size: 0.7em;" class="cursor-default font-semibold">VIP</span>
                        </div>
                        <div class="tag-box">
                            <span style="font-size: 0.7em; "class="cursor-default font-semibold">Приоритет</span>
                        </div>
                        <div class="add-tag-box">
                            <Plus30Icon class="w-4 h-4 changeable-icon" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="any-contaier-row" style="width: 100%; gap: 12px;">
                <div class="transparent-box">
                    <OpenIn40Icon class="w-6 h-6 changeable-icon"/>
                    <p class="transparent-box-title font-semibold">Открыть в контексте</p>
                </div> 
                <div class="transparent-box">
                    <BoxIcon class="w-6 h-6 changeable-icon"/>
                    <p class="transparent-box-title font-semibold">Модули</p>
                </div> 
                <div class="transparent-box">
                    <KeyIcon class="w-6 h-6 changeable-icon"/>
                    <p class="transparent-box-title font-semibold">API</p>
                </div>
                <div class="transparent-box">
                    <EditPencilIcon class="w-6 h-6 changeable-icon"/>
                    <p class="transparent-box-title font-semibold">Редактирование</p>
                </div>         
            </div>
            <div class="page-selector-grid">
                <div class="page-item" v-for="page in Object.keys(pages)" :class="selectPage === page ? 'page-item-selected' : ''" @click="switchPage(page)">
                    <span class="select-none font-semibold" >{{ page }}</span>
                </div>
            </div>
            <component :is="pages[selectPage]"/>
        </div>
    </div>
    <div class="load-container" v-if="menuStore.fetchDataLoad">
        <Icon icon="line-md:loading-loop" width="120"/>
    </div>
</template>
<style scoped>
@import '~/assets/css/any-container.css';
.app-container{
    height: 100vh;
    width: 100%;
    overflow-y:scroll;
    display: flex;
    flex-direction: column;
    padding: 50px 100px;
    background-color: #f8fbfc;
}



.modal-overlay{
    animation: modal-overlay-show 0.15s ease-out; 
    background-color: rgba(91, 91, 91, 0.545);
    position: fixed;
    inset: 0;

}
.modal-content{
  overflow-y: auto;
  position: fixed;
  top: 50%;
  left: 50%;
  background-color: #f7fafc;
  outline: none;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 600px;
  max-height: 85vh;
  padding: 25px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-content[data-state="open"] {
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.load-container{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.98);
  z-index: 9999;
  position: fixed;
  top: 0;
  left: 0;
}

.billing-container{
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.title-container{
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 10px;
    margin-bottom: 5px;
}
.any-contaier-row{
    display: flex;
    flex-direction: row;
}
.any-contaier-column{
    display: flex;
    flex-direction: column;
}
.back-arrow-box{
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;
    width: 36px;
    border-radius: 6px;

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
.status-title{  
    font-size: 0.75em;
    font-weight: 500;
    color: white;
}
.back-arrow-svg{
    color : black;
}

.company-title{
    font-size: 1.5em;
}
.tag-box{
    padding: 3px 8px;
    display: flex;
    height: fit-content;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border-color: #e7eaee;
    border-width: 1.5px;

}   
.add-tag-box{

    display: flex;
    align-items: center;
    height: 25px;
    width: 25px;
    justify-content: center;
    border-radius: 6px;
    border-color: #e7eaee;
    border-width: 1.5px;
}
.changeable-icon{
    color: rgb(94, 94, 94);
}
.transparent-box{
    padding: 5px 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 6px;
    border-color: #e7eaee;
    border-width: 1.5px;
}
.transparent-box-title{
    font-size: 1em;
    cursor: default;
    user-select: none;
    
}
.page-selector-grid{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    width: 100%;
    height: 36px;
    background-color: #edf2f7;
    border-radius: 10px;
    margin-top: 20px;
    padding: 4px;
    gap: 5px;
}
.page-item{
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
}
.page-item-selected{
    background-color: white;
}
.back-arrow-box:hover, .add-tag-box:hover, .transparent-box:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.back-arrow-box:hover .back-arrow-svg, .add-tag-box:hover .changeable-icon, .transparent-box:hover .changeable-icon, .transparent-box:hover .transparent-box-title{
    color: #437db4;
    transition: color 0.15s ease;
}

@keyframes modal-overlay-show{
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
@keyframes contentShow{
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

</style>