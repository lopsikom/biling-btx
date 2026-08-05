<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { SelectorObject } from '~/services/models';
import Plus30Icon from '@bitrix24/b24icons-vue/actions/Plus30Icon'
import usebillingStateStore from '~/services/stores/billingStateStore';
import useMenuStore from '~/services/stores/menuStores';
import useModalStore from '~/services/stores/modalStore';
import useToastStore from '~/services/stores/toastStore';
import useBitrixStateStore from '~/services/stores/bitrixStateStore';
import { TagCreate, type ITag } from '~~/shared/models/APIModels';
import useConfirmStore from '~/services/stores/confirmStore';

const billingStateStore = usebillingStateStore()
const bitrixStateStore = useBitrixStateStore()
const modalStore = useModalStore();
const toastStore = useToastStore();
const menuStore = useMenuStore()
const confirmStore = useConfirmStore();

const {$axios} = useNuxtApp();

const createTag = ref<boolean>(false);
const selectorItemsTag = computed(() => billingStateStore.tagList.filter(i => billingStateStore.tagsCompany.every(d => d.id !== i.id )))
const iconsList = ref<string[]>([
    "material-symbols:crown",
    "ant-design:thunderbolt-filled",
    "material-symbols:ac-unit",
    "material-symbols:account-balance-wallet-outline",
    "ri:cloud-line",
    "ri:delete-bin-7-line",
    "ri:exchange-dollar-line",
    "ri:eye-line",
    "ri:eye-off-line",
    "ri:heart-fill",
    "ri:key-2-fill",
    "ri:lightbulb-ai-fill",
    "ri:lock-fill",
    "ri:mail-fill",
    "ri:notification-3-fill",
    "ri:send-ins-fill"

])
const selectIcon = ref<string | null>(null)
const tagName = ref<string>()
const deleteTag = ref<boolean>(false)

async function selectTag(tag : ITag){
    if(deleteTag.value) {
        try {
            confirmStore.ask({
                title : "Удалить тэг?",
                message : `Тэг "${tag.title} будет удалён безвостратно"`,
                onConfirm: async () => {
                    await $axios.deleteTag(tag.id)
                    toastStore.openToast("Тэг удалён");
                    deleteTag.value = false;
                }
            })
            
        }catch(e){
            console.error(e)
            toastStore.openToast("Ошибка удаления тэга")
        
        }
    }
    else {    
        try{
            await $axios.postBindTagCompany(bitrixStateStore.bitrixCompany!.ID, tag.id);
            billingStateStore.tagsCompany.push(tag);
            toastStore.openToast("Тэг добавлен");
            modalStore.hideModal();
        }catch(e){
            console.error(e)
            toastStore.openToast("Ошибка добавления тэга");
        }}
}
async function createNewTag() {
    try{
        if(!tagName.value) {
            toastStore.openToast("Пустое имя тэга")
            return
        }
        const tag = await $axios.postTag({title : tagName.value, icon : selectIcon.value})
        billingStateStore.tagList.push(tag);
        toastStore.openToast("Тэг создан")
        createTag.value = false;
    }catch(e) {
        console.error(e)
        toastStore.openToast("Ошибка cоздания тэга");
    }
}

</script>

<template>
<div class="flex mb-[35px]">
        <div class="flex flex-col">
            <span class="text-lg font-semibold select-none">Добавление тэга</span>
        </div>
    </div>
    <div class="assign-modal">
        <div class="any-white-container p-5 gap-5 flex flex-col" style="width: 100%;">
            <span class="text-lg font-semibold select-none">Список тэгов</span>
            <div class="flex  gap-2 flex-wrap">
                <div class="tag-box basis-[200px]" :class="deleteTag ? 'red-hover' : 'blue-hover'" v-for="item in selectorItemsTag" @click="selectTag(item)">
                    <Icon :icon="item.icon" class="changeable-icon text-[16px]" v-if="item.icon"></Icon>
                    <span style="font-size: 0.8em;" class="cursor-default changeable-icon font-semibold">{{ item.title }}</span>
                </div>
                <div class="add-tag-box" @click="() => createTag = true" v-if="!deleteTag" >
                  <Plus30Icon class="w-4 h-4 changeable-icon"/>
              </div>
            </div>
            <div class="flex flex-col gap-2" v-if="createTag">
                <span class="text-lg font-semibold select-none">Создание тэга</span>
                <InputBox title="Название тэга" :required="true" v-model="tagName" placeholder="Название..." style="width: 50%;"></InputBox>
                <span class="text-sm font-semibold select-none">Список иконок</span>
                <div class="flex  gap-2 flex-wrap">
                    <div class="icon-box blue-hover" v-for="value in iconsList" @click="() => selectIcon === value ? selectIcon = null : selectIcon = value ":class="selectIcon === value ? 'selected-icon' : ''">
                        <div style="position: absolute; top: -3px;  right: -3px; padding: 1px; border-radius: 100%; background: #bae7ff ;" v-if="selectIcon === value" >
                            <Icon icon="material-symbols:done" style="color: #437db4;"/>
                        </div>
                        <Icon class="text-[30px] changeable-icon" :icon="value"/>
                    </div>
                </div>
                <div class="flex gap-4" style="margin-left: auto;">
                    <div class="add-tag-box mt-5" @click="createTag = false">
                        <span class="select-none text-sm hover-item">Закрыть</span>
                    </div>
                    <div class="add-tag-box mt-5" @click="createNewTag()">
                        <span class="select-none text-sm hover-item">Добавить</span>
                    </div>
                </div>
            </div>
            <div class="delete-tag-box red-hover" style="margin-left: auto;" @click="() => deleteTag = !deleteTag" v-if="!createTag">
                <span class="select-none text-sm hover-item">{{ deleteTag ? "Отмена" : "Удалить" }}</span>
            </div>
        </div>
    </div>
    <div class="flex mt-[35px] gap-[20px]" style="margin-left: auto; width: 50%; flex-direction: row-reverse;">
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
.changeable-icon{
    color: rgb(94, 94, 94);
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
.tag-box{
    padding: 3px 8px;
    display: flex;
    flex-direction: row;
    height: fit-content;
    align-items: center;
    min-width: 20px;
    max-width: fit-content;
    justify-content: center;
    border-radius: 6px;
    border-color: #e7eaee;
    border-width: 1.5px;

}
.add-tag-box{
    display: flex;
    align-items: center;
    padding: 5px 10px;
    min-height: 25px;
    min-width: 25px;
    max-width: fit-content;
    max-height: fit-content;
    justify-content: center;
    border-radius: 6px;
    border-color: #e7eaee;
    border-width: 1.5px;
}
.delete-tag-box{
    display: flex;
    align-items: center;
    padding: 5px 10px;
    min-height: 25px;
    min-width: 25px;
    max-width: fit-content;
    max-height: fit-content;
    justify-content: center;
    border-radius: 6px;
    border-color: #e7eaee;
    border-width: 1.5px;
}
.icon-box{
    display: flex;
    align-items: center;
    height: 55px;
    width: 55px;
    justify-content: center;
}
.selected-icon{
    position: relative;
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.selected-icon .changeable-icon{
    color: #437db4;
    transition: color 0.15s ease;
}
.blue-hover:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.blue-hover:hover .hover-item, .add-tag-box:hover .hover-item, .blue-hover:hover .changeable-icon{
    color: #437db4;
    transition: color 0.15s cubic-bezier(0.16, 1, 0.3,);
}
.red-hover:hover {
    background-color: #fee2e2; /* светло-красный фон */
    transition: background-color 0.15s ease;
}

.red-hover:hover .hover-item, .red-hover:hover .changeable-icon{
    color: #dc2626; /* красный цвет */
    transition: color 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-item-selected{
    background-color: white;
}
.back-arrow-box:hover, .add-tag-box:hover, .transparent-box:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.icon-box:hover  .changeable-icon,.back-arrow-box:hover .back-arrow-svg, .add-tag-box:hover .changeable-icon, .transparent-box:hover .changeable-icon, .transparent-box:hover .transparent-box-title{
    color: #437db4;
    transition: color 0.15s ease;
}
</style>