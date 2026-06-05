<script setup lang="ts">
import SearchIcon from '@bitrix24/b24icons-vue/outline/SearchIcon'
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import useModalStore from '~/services/stores/modalStore'
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum'
import Selector from '../Selector.vue'
import { PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from 'reka-ui'
import { entityType, EventType, type IEvent, type IEventFilter } from '~~/shared/models/APIModels'
import useToastStore from '~/services/stores/toastStore'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import { type IUser, type IDeal, type IStage, type SelectorObject, DealStageStatus } from '~/services/models'
import type { CalendarDate } from '@internationalized/date'


const billingStateStore = usebillingStateStore()
const bitrixStateStore = useBitrixStateStore()
const eventSource = ref<string[]>(["События биллинга", "События сделок"])
const RoleItems = ref<string[]>(["dawdaw", "dawdwa"])
const RoleMenuValue = ref<string>()
const eventSourceValue = ref<"События биллинга" | "События сделок">("События биллинга")
const search = ref<string>()
const toastStore = useToastStore()
const {$axios} = useNuxtApp()
const eventsList = ref<IEvent[]>()
const countEvent = ref<number>();
const limitPagination = ref<number>(10);
const isLoad = ref<boolean>(false)
// const UsersBitrix = ref<IUser[]>([]);
const dealsBitrix = ref<IDeal[]>([]);
const eventsDeal = ref<IStage[]>([]);
const DateFilter = ref<CalendarDate>();
const eventDealComputed = computed(() => {
    return eventsDeal.value.map(e => {
        // const user = UsersBitrix.value.find(u => u.ID === e.OWNER_ID.toString())
        const deal = dealsBitrix.value.find(d => d.ID === e.OWNER_ID.toString())
        return {
            dealTitle : deal?.TITLE,
            stageId : e.STAGE_ID,
            stageSematic : e.STAGE_SEMANTIC_ID,
            createdAt : e.CREATED_TIME
        }
    })
})

const ActionRecord : Record<string, string> = {
    [EventType.CREATE] : "Добавление",
    [EventType.DELETE] : "Удаление",
    [EventType.UPDATE] : "Изменение"
}

const EntityRecord : Record<string, string> = {
    [entityType.CONNECTION] : "подключенияе",
    [entityType.AUTOINFORMATION] : "модуля автоинформирования",
    [entityType.CHAT_BOT] : "чат бота",
    [entityType.CONTRACT] : "договора",
    [entityType.VATS] : "ВАТС",
    [entityType.VOICE_ROBOT] : "голосового робота",
    [entityType.WEBFORM] : "вебформы"
}

const StageRecord : Record<string, string> ={ 
// === Воронка 0 (общая) ===
    [DealStageStatus.STAGE_NEW]: "Создание новой сделки",
    [DealStageStatus.STAGE_NDS]: "Переход на стадию НДЗ",
    [DealStageStatus.STAGE_VKS]: "Переход на стадию ВКС",
    [DealStageStatus.STAGE_NAZVANIE]: "Переход на стадию Название",
    [DealStageStatus.STAGE_WON]: "Удачное завершение сделки",
    [DealStageStatus.STAGE_LOSE]: "Неудачное завершение сделки",

    // === Воронка 9 ===
    [DealStageStatus.C9_NEW]: "Создание новой сделки",
    [DealStageStatus.C9_RAZBOR]: "Передача на разбор",
    [DealStageStatus.C9_OTLOJILI]: "Сделка отложена",
    [DealStageStatus.C9_HOTYAT_NE_MOGUT]: "Клиент хочет, но пока не готов",
    [DealStageStatus.C9_PREZENTACIYA]: "Назначена презентация",
    [DealStageStatus.C9_KP_OTPRAVLENO]: "Отправлено коммерческое предложение",
    [DealStageStatus.C9_NA_RESHENII]: "Сделка на принятии решения",
    [DealStageStatus.C9_PREPARATION]: "Отправлен договор",
    [DealStageStatus.C9_DOGOVOR_PODPISAN]: "Договор подписан",
    [DealStageStatus.C9_VNEDRENIE]: "Передача на внедрение",
    [DealStageStatus.C9_RABOTA_VYPOLNENA]: "Работа выполнена",
    [DealStageStatus.C9_PODPISANIE_AKTA]: "Подписание акта приёма-передачи",
    [DealStageStatus.C9_PREZENTACIYA_PROVEDENA]: "Презентация проведена",
    [DealStageStatus.C9_WON]: "Удачное завершение сделки",
    [DealStageStatus.C9_LOSE]: "Неудачное завершение сделки",

    // === Воронка 10 ===
    [DealStageStatus.C10_RABOTAYUT]: "Клиент в работе",
    [DealStageStatus.C10_OTKAZALIS]: "Клиент отказался от работы",
    [DealStageStatus.C10_USLOVNYY_OTKAZ]: "Условный отказ клиента",
    [DealStageStatus.C10_OTLOJILI]: "Сделка отложена",
    [DealStageStatus.C10_RABOTAYUT_KZ]: "Клиент в работе (Казахстан)",
    [DealStageStatus.C10_WON]: "Удачное завершение сделки",
    [DealStageStatus.C10_LOSE]: "Неудачное завершение сделки",

    // === Воронка 12 ===
    [DealStageStatus.C12_NEW]: "Создание новой сделки",
    [DealStageStatus.C12_OTLOJILI]: "Сделка отложена",
    [DealStageStatus.C12_PREZENTACIYA]: "Назначена презентация",
    [DealStageStatus.C12_PREZENTACIYA_PROVEDENA]: "Презентация проведена",
    [DealStageStatus.C12_KP_OTPRAVLENO]: "Отправлено коммерческое предложение",
    [DealStageStatus.C12_NA_PAUZE]: "Сделка поставлена на паузу",
    [DealStageStatus.C12_NA_RESHENII]: "Сделка на принятии решения",
    [DealStageStatus.C12_DOGOVOR_OTPRAVLEN]: "Договор отправлен клиенту",
    [DealStageStatus.C12_DOGOVOR_PODPISAN]: "Договор подписан",
    [DealStageStatus.C12_VNEDRENIE]: "Передача на внедрение",
    [DealStageStatus.C12_RABOTA_VYPOLNENA]: "Работа выполнена",
    [DealStageStatus.C12_SCHET_OPLACHEN]: "Счёт оплачен",
    [DealStageStatus.C12_WON]: "Удачное завершение сделки",
    [DealStageStatus.C12_LOSE]: "Неудачное завершение сделки",
    [DealStageStatus.C12_APOLOGY]: "Анализ причины провала сделки",

    // === Воронка 15 ===
    [DealStageStatus.C15_NEW]: "Первое касание с клиентом",
    [DealStageStatus.C15_NDZ]: "Переход на стадию НДЗ",
    [DealStageStatus.C15_VKS]: "Переход на стадию ВКС",
    [DealStageStatus.C15_KP]: "Подготовка коммерческого предложения",
    [DealStageStatus.C15_DOGOVOR]: "Переход на стадию договора",
    [DealStageStatus.C15_VNEDRENIE]: "Передача на внедрение",
    [DealStageStatus.C15_AKTY_PO]: "Подписание актов приёма-передачи ПО",
    [DealStageStatus.C15_WON]: "Удачное завершение сделки",
    [DealStageStatus.C15_LOSE]: "Неудачное завершение сделки",
    [DealStageStatus.C15_APOLOGY]: "Анализ причины провала сделки",

    // === Воронка 16 ===
    [DealStageStatus.C16_NEW]: "Необработанная входящая заявка",
    [DealStageStatus.C16_NDZ]: "Переход на стадию НДЗ",
    [DealStageStatus.C16_OTLOJILI]: "Сделка отложена",
    [DealStageStatus.C16_PRESALE]: "Передача на пресейл",
    [DealStageStatus.C16_VKS]: "Переход на стадию ВКС",
    [DealStageStatus.C16_KP]: "Подготовка коммерческого предложения",
    [DealStageStatus.C16_DOGOVOR]: "Переход на стадию договора",
    [DealStageStatus.C16_WON]: "Удачное завершение сделки",
    [DealStageStatus.C16_LOSE]: "Неудачное завершение сделки",
    [DealStageStatus.C16_APOLOGY]: "Анализ причины провала сделки",

    // === Воронка 17 ===
    [DealStageStatus.C17_NEW]: "Создание новой сделки",
    [DealStageStatus.C17_VKS]: "Переход на стадию ВКС",
    [DealStageStatus.C17_KP]: "Подготовка коммерческого предложения",
    [DealStageStatus.C17_DOGOVOR]: "Переход на стадию договора",
    [DealStageStatus.C17_VNEDRENIE]: "Передача на внедрение",
    [DealStageStatus.C17_AKTY_PO]: "Подписание актов приёма-передачи ПО",
    [DealStageStatus.C17_WON]: "Удачное завершение сделки",
    [DealStageStatus.C17_LOSE]: "Неудачное завершение сделки",
    [DealStageStatus.C17_APOLOGY]: "Анализ причины провала сделки",

    // === Воронка 18 ===
    [DealStageStatus.C18_NEW]: "Создание новой сделки",
    [DealStageStatus.C18_PODGOTOVKA_KP]: "Подготовка коммерческого предложения",
    [DealStageStatus.C18_KP_OTPRAVLENO]: "Коммерческое предложение отправлено",
    [DealStageStatus.C18_FORMIROVANIE_DOGOVORA]: "Формирование договора",
    [DealStageStatus.C18_DOGOVOR_PODPISAN]: "Договор подписан",
    [DealStageStatus.C18_WON]: "Удачное завершение сделки",
    [DealStageStatus.C18_LOSE]: "Неудачное завершение сделки",
    [DealStageStatus.C18_APOLOGY]: "Анализ причины провала сделки",

    // === Воронка 19 ===
    [DealStageStatus.C19_NEW]: "Создание новой сделки",
    [DealStageStatus.C19_PODGOTOVKA_DOCS]: "Подготовка документов",
    [DealStageStatus.C19_SCHET_PREDOPLATA]: "Выставление счёта на предоплату",
    [DealStageStatus.C19_V_RABOTE]: "Передача в работу",
    [DealStageStatus.C19_FINALNYY_SCHET]: "Выставление финального счёта",
    [DealStageStatus.C19_WON]: "Удачное завершение сделки",
    [DealStageStatus.C19_LOSE]: "Неудачное завершение сделки",
    [DealStageStatus.C19_APOLOGY]: "Анализ причины провала сделки",
}

const StageSemantic : Record<string, string> = {
    "P" : "Промежуточная  стадия",
    "S" : "Успешная стадия",
    "F" : "Провальная стадия"
}

const selectStageSemanticFiltter = computed(() => {
    const b : SelectorObject[] = [];
    for (const i in StageSemantic) b.push({label : i, value : StageSemantic[i]!});
    b.unshift({label : "all", value : "Все стадии"});
    return b;
})
const selectStageFilter = ref({label : "all", value : "Все стадии"})
const ActionSelectorBilling = computed(() => {
    const b : SelectorObject[] = []
    for(const i in ActionRecord){
        b.push({label : i, value : ActionRecord[i]!})
    }
    b.unshift({label : "all", value : "Все события"})
    return b
})
const selectActionBilling = ref<SelectorObject>({label : "all", value : "Все события"})

const userComputed = computed(() => {
    const a = billingStateStore.companyUsers.map(m => { return {label : m.id, value : `${m.name} ${m.last_name}`} as SelectorObject})
    a.unshift({label : 0, value : "Все пользователи"})
    return a
})

const selectUser = ref<SelectorObject>({label : 0, value : "Все пользователи"})

const selectEntityList = ref([
    {
        label : "all",
        value : "Все модули"
    },
    {
        label : entityType.CONNECTION,
        value : "Подключение"
    },
    {
        label : entityType.AUTOINFORMATION,
        value : "Автоинформирование"
    },
    {
        label : entityType.CHAT_BOT,
        value : "Чат-бот"
    },
    {
        label : entityType.CONTRACT,
        value : "Договора"
    },
    {
        label : entityType.VATS,
        value : "ВАТС"
    },
    {
        label : entityType.VOICE_ROBOT,
        value : "Голосовой робот"
    },
    {
        label : entityType.WEBFORM,
        value : "Веб-форма"
    }

])

const selectEntityfilter = ref({label : "all", value : "Все модули" })

const selectorDealsFilter = computed(() => {
    const a = dealsBitrix.value.map(d => {return {label : d.ID, value : d.TITLE} as SelectorObject});
    a.unshift({label : "all", value : "Все сделки"})
    return a;
})

const selectDeal = ref({label : "all", value : "Все сделки"})

function clearFilter(){
    selectDeal.value = {label : "all", value : "Все сделки"};
    selectEntityfilter.value = {label : "all", value : "Все модули" };
    selectUser.value = {label : 0, value : "Все пользователи"};
    selectActionBilling.value = {label : "all", value : "Все события"};
    selectStageFilter.value = {label : "all", value : "Все стадии"};
    DateFilter.value = undefined;
    // excludeDisabled.value = false;
    toastStore.openToast("Фильтр очищен")

}

async function getEventPagination(){
    isLoad.value = true
    try{
        const filter = {} as IEventFilter
        if(DateFilter.value) {
            if(DateFilter.value.year.toString().length > 3) filter.createdAt = `${DateFilter.value.year}-${String(DateFilter.value.month).padStart(2, '0')}-${String(DateFilter.value.day).padStart(2, '0')}T00:00:00.000Z`;
        }
        if( typeof selectActionBilling.value.label === "string" && selectActionBilling.value.label !== "all") filter.action = selectActionBilling.value.label as EventType;
        if(selectUser.value.label !== 0) filter.userId = selectUser.value.label as number;
        if(selectEntityfilter.value.label !== "all") filter.entity = selectEntityfilter.value.label as entityType
        const data = await $axios.getEvents({
            filter : filter,
            pagination : {
                skip : (pagePagination.value - 1) * limitPagination.value,
                limit : limitPagination.value
            }
        })
        eventsList.value = data.data;
        countEvent.value = data.count;
    }catch(e){
        console.error(e);
        toastStore.openToast("Ошибка получения событий");
    }finally{
        isLoad.value = false;
    }
} 

async function getEventDeals(){
    isLoad.value = true;
    const frame = bitrixStateStore.getBitrixClient();
    try{
        if(!frame) return
        if(dealsBitrix.value.length <= 0) dealsBitrix.value = await frame.getDeals();
        const filter: Record<string, unknown> = {}
        const dealIds = dealsBitrix.value.map(d => parseInt(d.ID))
        if(selectDeal.value.label !== "all") filter["OWNER_ID"] = selectDeal.value.label;
        else filter["@OWNER_ID"] = dealIds
        if(selectStageFilter.value.label !== "all") filter["STAGE_SEMANTIC_ID"] = selectStageFilter.value.label
        if(DateFilter.value) {
            filter[">=CREATED_TIME"] = `${DateFilter.value.year}-${String(DateFilter.value.month).padStart(2, '0')}-${String(DateFilter.value.day).padStart(2, '0')}T00:00:00`
            filter["<=CREATED_TIME"] = `${DateFilter.value.year}-${String(DateFilter.value.month).padStart(2, '0')}-${String(DateFilter.value.day).padStart(2, '0')}T23:59:59`
        }
        const data = await frame?.getStage(2, {order : {CREATED_TIME : "DESC"}, filter : filter, start : (pagePagination.value - 1) * 50})
        eventsDeal.value = data.result.items;
        countEvent.value = data.total;
    }catch(e){
        console.error(e);
        toastStore.openToast("Ошибка получения событий");
    }finally{ isLoad.value = false}
}

onMounted(async () => {
    isLoad.value = true;
    if(billingStateStore.companyUsers.length <= 0) billingStateStore.companyUsers = await $axios.getUsers();
    if(eventSourceValue.value === "События биллинга") {limitPagination.value = 10; await getEventPagination()}
    else {limitPagination.value = 50; await getEventDeals()}
})

const pagePagination = ref(1)

watch(() => [pagePagination.value,
            selectActionBilling.value,
            selectUser.value,            
            selectEntityfilter.value,
            selectDeal.value,
            selectStageFilter.value,  
        ], async () => {
            if(eventSourceValue.value === "События биллинга") await getEventPagination()
            else await getEventDeals()
})
watch(() => [
    DateFilter.value,
], async () => {
    if(DateFilter.value) {
        if(DateFilter.value.year.toString().length > 3) {
            if(eventSourceValue.value === "События биллинга") await getEventPagination()
            else await getEventDeals()
        }
    }
})
watch(() => eventSourceValue.value, async () => {
    countEvent.value = 0;
    if(eventSourceValue.value === "События биллинга") {limitPagination.value = 10; await getEventPagination()}
    else {limitPagination.value = 50; await getEventDeals()}
})

</script>
<template>
    <div class="flex flex-col">
        <div class="any-white-container px-5 py-4 flex flex-col h-[800px]">
            <div class="flex items-center">
                <div class="flex flex-col gap-1">
                    <span class="select-none font-semibold">События</span>
                    <span class="text-gray-500">Список событий организации</span>
                </div>
                <div class="clear-filter-btn items-center flex px-2 py-2 gap-1" style="margin-left: auto;" @click="clearFilter()">
                        <Icon icon="tdesign:filter-clear-filled" class="w-5 h-5 text-slate-50" />
                        <span class="select-none text-sm text-slate-50 font-semibold">Очистить фильтр</span>
                </div>
            </div>
            <div class="flex mt-5 gap-5 items-center">
                <div class="flex">
                    <Selector v-model="eventSourceValue" :items="eventSource" :width="200"/>
                </div>
                <div class="flex">
                    <Selector v-model="selectActionBilling" :items="ActionSelectorBilling" :width="200" v-if='eventSourceValue === "События биллинга"'/>
                    <Selector v-model="selectDeal" :items="selectorDealsFilter" :width="200" v-else/>
                </div>
                <div class="flex">
                    <Selector v-model="selectUser" :items="userComputed" :width="200" v-if='eventSourceValue === "События биллинга"'/>
                    <Selector v-model="selectStageFilter" :items="selectStageSemanticFiltter" :width="200" v-else/>
                </div>
                <div class="flex" v-show='eventSourceValue === "События биллинга"'>
                   <Selector v-model="selectEntityfilter" :items="selectEntityList" :width="200"/>
                </div>
            </div>
            <div class="flex mt-3">
                <DateRangePicker v-model="DateFilter"/>
            </div>
            <div class="h-[72%]" v-if="eventSourceValue === 'События биллинга'">
                <div class="flex flex-col h-[100%]" v-if="(countEvent && countEvent > 0) || isLoad">
                    <div class="flex items-center font-semibold text-lg
                        justify-center h-[100%] select-none" v-if="isLoad">
                        <Icon icon="line-md:loading-loop" class="text-blue-600" width="60"/>
                    </div>
                    <div class="users-list-grid mt-[20px]" v-else>
                        <div class="users-list-row h-[50px]" style="border-width: 0;">
                            <div class="font-semibold select-none">Сотрудник</div>
                            <div class="font-semibold select-none">Действие</div>
                            <div class="font-semibold select-none">Описание</div>
                            <div class="font-semibold select-none">Время</div>
                        </div>
                        <div style=" overflow-y: auto; ">
                            <div  v-for="(value, index) in eventsList" :key="index" >
                            <div class="users-list-row users-item">
                                <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ value.user_bitrix.name }} {{ value.user_bitrix.last_name }} {{ value.user_bitrix.second_name }}</p>
                                <div >
                                    <div class="any-white-container role-box px-[10px] py-[2px] flex justify-center align-center text-sm" :class="`type-box-${value.action}`" style="width: fit-content;" >{{ ActionRecord[value.action] ?? value.action }}</div>
                                </div>
                                <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ ActionRecord[value.action] ?? value.action }} {{ EntityRecord[value.entity] ?? value.entity }} {{ value.entityName ? `с названием ${value.entityName}` : ''  }}</p>
                                <div>{{ new Date(value.createdAt).toLocaleDateString() }} : {{ new Date(value.createdAt).toLocaleTimeString() }}</div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center font-semibold text-lg
                justify-center h-[100%] select-none" v-else>
                    Записи отсуствуют
                </div>
            </div>
             <div class="h-[72%]" v-else>
                <div class="flex flex-col h-[100%]" v-if="(countEvent && countEvent > 0) || isLoad">
                    <div class="flex items-center font-semibold text-lg
                        justify-center h-[100%] select-none" v-if="isLoad">
                        <Icon icon="line-md:loading-loop" class="text-blue-600" width="60"/>
                    </div>
                    <div class="users-list-grid mt-[30px]" v-else>
                        <div class="users-list-row h-[50px]" style="border-width: 0;">
                            <div class="font-semibold">Сделка</div>
                            <div class="font-semibold">Действие</div>
                            <div class="font-semibold">Описание</div>
                            <div class="font-semibold">Время</div>
                        </div>
                        <div style="overflow-y: auto;">
                            <div  v-for="(value, index) in eventDealComputed" :key="index" >
                                <div class="users-list-row users-item">
                                    <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ value.dealTitle }}</p>
                                    <div >
                                        <div class="any-white-container role-box px-[10px] py-[2px] flex justify-center align-center text-sm" :class="`type-box-${value.stageSematic}`" style="width: fit-content;" >{{ StageSemantic[value.stageSematic] ?? value.stageSematic }}</div>
                                    </div>
                                    <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ StageRecord[value.stageId] ?? value.stageId }}</p>
                                    <div>{{ new Date(value.createdAt).toLocaleDateString() }} : {{ new Date(value.createdAt).toLocaleTimeString() }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
            <div class="flex items-center font-semibold text-lg
            justify-center h-[100%] select-none" v-else>
                Записи отсуствуют
            </div>
        </div>
        <PaginationRoot
            v-if="countEvent && countEvent > 0"
            v-model:page="pagePagination"
            :total="countEvent"
            :sibling-count="2"
            :items-per-page="limitPagination"
            show-edges
            :default-page="1"
            style="margin-top: auto;">
            <PaginationList
            v-slot="{ items }"
            class="PaginationList"
            >
            <PaginationFirst class="Button">
                <Icon icon="radix-icons:double-arrow-left" />
            </PaginationFirst>
            <PaginationPrev
                :style="{ marginRight: 16 }"
                class="Button"
            >
                <Icon icon="radix-icons:chevron-left" />
            </PaginationPrev>
            <template v-for="(page, index) in items">
                <PaginationListItem
                v-if="page.type === 'page'"
                :key="index"
                class="Button"
                :value="page.value"
                >
                {{ page.value }}
                </PaginationListItem>
                <PaginationEllipsis
                v-else
                :key="page.type"
                :index="index"
                class="PaginationEllipsis"
                >
                &#8230;
                </PaginationEllipsis>
            </template>
            <PaginationNext
                :style="{ marginLeft: 16 }"
                class="Button"
            >
                <Icon icon="radix-icons:chevron-right" />
            </PaginationNext>
            <PaginationLast class="Button">
                <Icon icon="radix-icons:double-arrow-right" />
            </PaginationLast>
            </PaginationList>
        </PaginationRoot>
        </div>
    </div>
</template>
<style scoped>
    @import '~/assets/css/any-container.css';

.Button{
  text-align: center;
  font-size: 15px;
  line-height: 1;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  width: 2.25rem;
  border-radius: 0.25rem; 
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.Button:disabled {
  opacity: .5
}

.Button:hover{
  background-color: white
}

.type-box-create{
 background-color: #9cd1ff;
  -webkit-text-fill-color: rgb(13, 12, 12);
}
.type-box-P,
.type-box-update{
 background-color: #3b74a6;
  -webkit-text-fill-color: white;
}
.clear-filter-btn{
    background: red;
    border-radius: 10px;
    height: fit-content;
}
.type-box-S{
 background-color: #6ffe82;
 -webkit-text-fill-color: black;
}
.type-box-F,
.type-box-delete{
 background-color: #fd3d3d;
 -webkit-text-fill-color: white;
}

.Button[data-selected]{ 
  background-color: #3989d1;
  color: rgb(255 255 255);
}

.PaginationEllipsis{
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center
}

.PaginationList{
  display: flex;
  align-items: center;
  margin-top: auto;
  gap: 0.25rem; 
  color: black
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
    overflow-x: auto;
    overflow-y: hidden;
    display: grid;
    grid-auto-rows: auto;
    width: 100%;
}
.users-list-row{
    display: grid;
    grid-template-columns: 220px 190px 1fr 220px;
    overflow-x: auto;
    align-items: center;
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
    padding: 2px 8px;
    height: 22px;
    gap: 3px;
    border-radius: 5px;
    width: fit-content;
}
.status-box-active{
    background-color: #3989d1;
    -webkit-text-fill-color: white;
}
.status-box-disable{
     background-color: #fd3d3d;
    -webkit-text-fill-color: white;
}
.users-item:hover{
    background-color: #ebf8ff;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

</style>
