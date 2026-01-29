<script setup lang="ts">
import SuccessIcon from '@bitrix24/b24icons-vue/button/SuccessIcon'
import MoreIcon from '@bitrix24/b24icons-vue/actions/MoreIcon'
import Cross25Icon from '@bitrix24/b24icons-vue/actions/Cross25Icon'
import useBitrixStateStore from '~/services/stores/bitrixStateStore';
import useModalStore from '~/services/stores/modalStore';
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum';

const bitrixStateStore = useBitrixStateStore()
const modalStore = useModalStore()


</script>
<template>
<div class="main-page-container">
    <div class="main-info-grid">
        <div class="main-info-item any-white-container blue-hover">
            <div>
                <span class="font-semibold select-none">Тариф</span>
            </div>
            <div class="flex flex-col">
                <span class="text-2xl cursor-default">Корп</span>
                <span class="text-gray-500 text-sm cursor-default">Активен до: 31.12.2025</span>
            </div>
        </div>
        <div class="main-info-item any-white-container">
            <div>
                <span class="font-semibold select-none">Дата создания</span>
            </div>
            <div class="flex flex-col">
                <span class="text-2xl cursor-default">{{ bitrixStateStore.getDateCreate() }}</span>
                <span class="text-gray-500 text-sm cursor-default">Последняя активность:<br>{{ bitrixStateStore.lastActivityCompany() }}</span>
            </div>
        </div>
        <div class="main-info-item any-white-container blue-hover" @click="modalStore.showModal(ModalEnum.ASSIGN_MODAL)">
            <div>
                <span class="font-semibold select-none">Отвественный</span>
            </div>
            <div class="flex flex-col" v-if="bitrixStateStore.companyAssignUser">
                <span class="text-2xl cursor-default">{{ bitrixStateStore.getShortName(bitrixStateStore.companyAssignUser) }}</span>
                <span class="text-gray-500 text-sm cursor-default">{{ bitrixStateStore.companyAssignUser?.WORK_POSITION }}</span>
                <span class="text-gray-500 text-xs cursor-default" style="margin-top: 10px;">Нажмите для просмотра контактов</span>
            </div>
            <div class="flex flex-col" v-else>
                <span class="text-3xl cursor-default">Отсутсвует</span>
            </div>
        </div>
    </div>
    <div class="any-white-container connected-container">
        <div class="flex flex-col gap-1">
            <span class="text-lg select-none">Подключенные модули</span>
            <span class="text-gray-500 text-sm select-none">Активные модули организации</span>
        </div>
        <div class="connected-empty-box">
            <span class="text-gray-500 select-none">Нет активных модулей</span>
        </div>
    </div>
    <div class="connected-container any-white-container gap-5">
        <div class="flex flex-col gap-1 mb-2">
            <span class="select-none font-semibold">Подключенния</span>
            <span class="text-gray-500 select-none">Подключенные аккаунты и сервисы</span>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm select-none">Мессенджеры</span>
            <div class="flex flex-col gap-2">
                <div class="any-white-container connected-item-box">
                    <div class="messenger-whatsap-container mr-2">
                        <div class="messenger-whatsapp-char-logo">W</div>
                    </div>
                    <div class="flex flex-col gap-2">
                            <span class="text-sm">WhatsApp Business</span>
                            <span class="text-gray-500 text-xs ">+7 (495) 123-45-67</span>
                    </div>
                    <div class="flex gap-3" style="margin-left: auto; align-items: center;">
                        <div class="flex any-green-container gap-1 py-0.5 px-1.5" style="height: fit-content;">
                            <SuccessIcon class="green-container-item w-4 h-4" />
                            <span class="green-container-item text-xs">Подключен</span>
                        </div>
                        <MoreBox/>
                    </div>
                    
                </div>
                <div class="any-white-container connected-item-box">
                    <div class="messenger-telegram-container mr-2">
                        <div class="messenger-telegram-char-logo">T</div>
                    </div>
                    <div class="flex flex-col gap-2">
                            <span class="text-sm">Telegram Bot</span>
                            <span class="text-gray-500 text-xs ">@technosfera_bot</span>
                    </div>
                    <div class="flex gap-3" style="margin-left: auto; align-items: center;">
                        <div class="flex any-red-container gap-1 py-0.5 px-1.5" style="height: fit-content;">
                            <Cross25Icon class="red-container-item w-4 h-4" />
                            <span class="red-container-item text-xs">Ошибка соединения</span>
                        </div>
                        <MoreBox/>
                    </div>
                </div>
                <div class="any-white-container connected-item-box">
                    <div class="messenger-telegram-container mr-2">
                        <div class="messenger-telegram-char-logo">VK</div>
                    </div>
                    <div class="flex flex-col gap-2">
                            <span class="text-sm">VK Сообщества</span>
                            <span class="text-gray-500 text-xs ">vk.com/technosfera</span>
                    </div>
                    <div class="flex gap-3" style="margin-left: auto; align-items: center;">
                        <div class="flex any-green-container gap-1 py-0.5 px-1.5" style="height: fit-content;">
                            <SuccessIcon class="green-container-item w-4 h-4" />
                            <span class="green-container-item text-xs">Подключен</span>
                        </div>
                        <MoreBox/>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm select-none">ВАТС</span>
            <div class="flex flex-col gap-2">
                <div class="any-white-container connected-item-box">
                    <div class="flex flex-col gap-2">
                            <span class="text-sm">Основной номер</span>
                            <span class="text-gray-500 text-xs ">+7 (495) 123-45-67</span>
                    </div>
                    <div class="flex gap-3" style="margin-left: auto; align-items: center;">
                        <div class="flex any-red-container gap-1 py-0.5 px-1.5" style="height: fit-content;">
                            <Cross25Icon class="red-container-item w-4 h-4" />
                            <span class="red-container-item text-xs">Ошибка соединения</span>
                        </div>
                        <MoreBox/>
                    </div>
                </div>
                <div class="any-white-container connected-item-box">
                    <div class="flex flex-col gap-2">
                            <span class="text-sm">Дополнительный номер</span>
                            <span class="text-gray-500 text-xs ">+7 (495) 987-65-43</span>
                    </div>
                    <div class="flex gap-3" style="margin-left: auto; align-items: center;">
                        <div class="flex any-green-container gap-1 py-0.5 px-1.5" style="height: fit-content;">
                            <SuccessIcon class="green-container-item w-4 h-4" />
                            <span class="green-container-item text-xs">Подключен</span>
                        </div>
                        <MoreBox/>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-sm select-none">SMS</span>
            <div class="flex flex-col gap-2">
                <div class="any-white-container connected-item-box">
                    <div class="flex flex-col gap-2">
                            <span class="text-sm">SMS-шлюз</span>
                            <span class="text-gray-500 text-xs ">TECHNOSFERA</span>
                    </div>
                    <div class="flex gap-3" style="margin-left: auto; align-items: center;">
                        <div class="flex any-green-container gap-1 py-0.5 px-1.5" style="height: fit-content;">
                            <SuccessIcon class="green-container-item w-4 h-4" />
                            <span class="green-container-item text-xs">Подключен</span>
                        </div>
                        <MoreBox/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>
<style scoped>

@import '~/assets/css/any-container.css';

.main-page-container{
    display: flex;
    flex-direction: column;
    gap: 25px;
}
.main-info-grid{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0,1fr));
    height: 200px;
    width: 100%;
    gap: 25px;
}
.main-info-item{
    display: flex;
    flex-direction: column;
    padding: 24px 24px 0px;
    gap: 16px;
}
.connected-container{
    min-height: 240px;
    height: fit-content;
    display: flex;
    flex-direction: column;
    padding: 25px 20px;
}
.connected-modules-box{
    display: flex;
    flex-direction: column;

}
.connected-empty-box{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
}
.messenger-whatsap-container{
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: rgb(230, 250, 238);
    color: rgb(230, 250, 238);
    height: 32px;
    width: 32px;
}
.messenger-telegram-container{
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: rgb(233, 242, 2558);
    color: rgb(233, 242, 255);
    height: 32px;
    width: 32px;
}
.messenger-telegram-char-logo{
    color: color-mix(in srgb, currentColor 20%, blue);
}
.messenger-whatsapp-char-logo{
    color: color-mix(in srgb, currentColor 15%, green);
}
.connected-item-box{
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding: 12px;
}
.more-box{
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;
    width: 36px;
    border-radius: 6px;
}
.blue-hover:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
</style>