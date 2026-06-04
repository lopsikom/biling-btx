<script setup lang="ts">
import { Icon } from '@iconify/vue';
import InputBox from '../InputBox.vue';
import Selector from '../Selector.vue';
import usebillingStateStore from '~/services/stores/billingStateStore';
import useModalStore from '~/services/stores/modalStore';
import { diffObject, isDiffArraySimple, isValidData } from '~/services/utils/utils';
import useToastStore from '~/services/stores/toastStore';
import { ModalEnum, ModuleEnum } from '~/services/models/enums/billing/ModalsEnum';
import useMenuStore from '~/services/stores/menuStores';

const modalStore = useModalStore()


const ModalArgs = modalStore.argsModal


const openModulsMenu = ref({
    vats : (ModalArgs[ModuleEnum.VATS] as boolean) ?? false,
    voiceRobot : (ModalArgs[ModuleEnum.VOICE_ROBOT] as boolean) ?? false,
    chatBot : (ModalArgs[ModuleEnum.CHAT_BOT] as boolean) ?? false,
    autoinfo : (ModalArgs[ModuleEnum.AUTOINFORMATION] as boolean) ?? false,
    autoinfo_with_voice : (ModalArgs[ModuleEnum.AUTOINFORMATION] as boolean) ?? false,
    autoinfo_without_voice : (ModalArgs[ModuleEnum.AUTOINFORMATION] as boolean) ?? false,
    autoinfo_sms : (ModalArgs[ModuleEnum.AUTOINFORMATION] as boolean) ?? false,
    webForm : (ModalArgs[ModuleEnum.WEBFORM] as boolean) ?? false
})

onBeforeMount(async () => {
    billingStateStore.contractsTariff = await $axios.getContracts({});
    for(const mod of Object.values(moduleRegistry)){
        for(const row of mod.list.value as any[]){
            row.selected_contract = ContractsSelect.value.find(c => c.label === row.old_item.contract_id)
        }
    }
})

const scrollTargets = {
    [ModuleEnum.VATS] : ref<HTMLElement | null>(null),
    [ModuleEnum.VOICE_ROBOT] : ref<HTMLElement | null>(null),
    [ModuleEnum.CHAT_BOT] : ref<HTMLElement | null>(null),
    [ModuleEnum.AUTOINFORMATION] : ref<HTMLElement | null>(null),
    [ModuleEnum.WEBFORM] : ref<HTMLElement | null>(null),
}

const scrollContainer = ref<HTMLElement | null>(null)

onMounted(() =>{
    const arg  = modalStore.findModalArg()
    if(scrollContainer.value && (arg && arg.value)) {
        const target = scrollTargets[arg.key as ModuleEnum]
        const parentScroll = scrollContainer.value.parentElement
        if(target.value && parentScroll) parentScroll.scrollTop = target.value.offsetTop
    }

})

const toastStore = useToastStore()

const {$axios} = useNuxtApp()

const billingStateStore = usebillingStateStore();

const menuStore = useMenuStore();


const tarrifs = ref(billingStateStore.tariff)

const durationList = [1, 3, 6, 12]

const ContractsSelect = computed(() =>
  billingStateStore.contractsTariff
    .filter(c => c.status !== "Завершен" && c.status !== "Приостановлен")
    .map(c => ({
      label: c.id,
      value: `${c.name} ${c.index ?? ''} ${c.org_name} ${c.status} от ${new Date(c.date_begin).toLocaleDateString()}`
})))

const tarrifsSelect = computed(() => tarrifs.value.map(c => {return {label : c.id, value : c.name}}))

function makeRow<T extends { tarrif_id?: number; contract_id: number }, E extends object>(
    source : T,
    extra : E = {} as E,
) {
    return {
        item : structuredClone(toRaw(source)),
        old_item : source,
        active : false,
        selected_tarrif : tarrifsSelect.value.find(t => t.label === source.tarrif_id),
        selected_contract : ContractsSelect.value.find(o => o?.label === source.contract_id),
        isDeleted : false,
        isEditName : false,
        isEditMenu : false,
        ...extra,
    }
}

function makeMulti<O extends { name : string }>(options : O[], selectedNames : string[]) {
    return options.map(o => ({ item : o, active : selectedNames.includes(o.name) }))
}

const voiceRobotComputed = ref(billingStateStore.voiceRobots.map(v => makeRow(v)))

const chatBotComputed = ref(billingStateStore.chatBots.map(m => makeRow(m, {
    messengers : makeMulti(billingStateStore.messengers, m.messengers),
    active_messengers : false,
})))

const webFormsComputed = ref(billingStateStore.webform.map(w => makeRow(w, {
    integrations : makeMulti(billingStateStore.integrations, w.integrations),
    acitve_integrations : false,
})))

const autoInfoComputed = ref(billingStateStore.autoinformations.map(w => makeRow(w)))

const vats = ref(billingStateStore.vats.map(v => makeRow(v)))
function addModuleVats(){
    vats.value.push(makeRow({
        id : 0, contract_id : 0, tarrif_id : 1, additional_users : 0,
        duration : 0, title : "ВАТС", active : false, price : 0,
    }))
}

function addModuleChatBot(){
    chatBotComputed.value.push(makeRow({
        id : 0, contract_id : 0, tarrif_id : 1, title : "Чат бот",
        lines_count : 0, active : false, price : 0, messengers : [],
    }, {
        messengers : makeMulti(billingStateStore.messengers, []),
        active_messengers : false,
    }))
}
function addModuleVoiceRobot(){
    voiceRobotComputed.value.push(makeRow({
        id : 0, contract_id : 0, title : "Голосовой робот",
        active : false, price : 0, lines : 0, tarrif_id : 1,
    }))
}
function addModuleWebForm(){
    webFormsComputed.value.push(makeRow({
        id : 0, contract_id : 0, tarrif_id : 1, title : "Веб-форма",
        active : false, price : 0, integrations : [],
    }, {
        integrations : makeMulti(billingStateStore.integrations, []),
        acitve_integrations : false,
    }))
}
function addModuleAutoInfromation(type_id : number){
    autoInfoComputed.value.push(makeRow({
        id : 0, contract_id : 0, type_id : type_id, title : "Автоинформирование",
        active : false, price : 0, quantity : 0, tarrif_id : 1,
    }))
}

function closeEditName(item : {item : {title : string}, isEditName : boolean}){
    if(item.item.title.trim() !== "") item.isEditName = false
}

function addContract(item : {item : any, 
selected_contract : {
    label: number;
    value: string;
} | undefined}){
    modalStore.addContractTariff = item
    modalStore.showHigherModal(ModalEnum.ADD_CONTRACT)
}

interface ModuleConfig {
    list : Ref<any[]>
    store : { id : number }[]
    numeric : readonly string[]
    post : (item : any) => Promise<any>
    patch : (id : number, diff : any) => Promise<any>
    remove : (id : number) => Promise<boolean>
    multi? : { field : string; rowKey : string; options : { id : number; name : string }[] }
}

const moduleRegistry : Record<string, ModuleConfig> = {
    vats : {
        list : vats,
        store : billingStateStore.vats,
        numeric : ['additional_users'] as const,
        post : (item : any) => $axios.postVats(item),
        patch : (id : number, diff : any) => $axios.patchVats(id, diff),
        remove : (id : number) => $axios.deleteVats(id),
    },
    voiceRobot : {
        list : voiceRobotComputed,
        store : billingStateStore.voiceRobots,
        numeric : ['lines'] as const,
        post : (item : any) => $axios.postVoiceRobot(item),
        patch : (id : number, diff : any) => $axios.patcVoiceRobot(id, diff),
        remove : (id : number) => $axios.deleteVoiceRobot(id),
    },
    chatBot : {
        list : chatBotComputed,
        store : billingStateStore.chatBots,
        numeric : ['lines_count'] as const,
        post : (item : any) => $axios.postChatBots(item),
        patch : (id : number, diff : any) => $axios.patcChatBots(id, diff),
        remove : (id : number) => $axios.deleteChatBot(id),
        multi : { field : 'messengers', rowKey : 'messengers', options : billingStateStore.messengers },
    },
    autoinfo : {
        list : autoInfoComputed,
        store : billingStateStore.autoinformations,
        numeric : ['quantity'] as const,
        post : (item : any) => $axios.postAutoInfo(item),
        patch : (id : number, diff : any) => $axios.patcAutoInfo(id, diff),
        remove : (id : number) => $axios.deleteAutoInfo(id),
    },
    webForm : {
        list : webFormsComputed,
        store : billingStateStore.webform,
        numeric : [] as const,
        post : (item : any) => $axios.postWebform(item),
        patch : (id : number, diff : any) => $axios.patcWebform(id, diff),
        remove : (id : number) => $axios.deleteWebform(id),
        multi : { field : 'integrations', rowKey : 'integrations', options : billingStateStore.integrations },
    },
} as const

function coerceNumeric(item : any, fields : readonly string[]) {
    for(const f of fields) item[f] = parseInt(item[f].toString())
}

function selectedNames(row : any, rowKey : string) : string[] {
    return toRaw(row[rowKey].filter((m : any) => m.active).map((m : any) => m.item.name))
}
function selectedIds(row : any, rowKey : string) : number[] {
    return row[rowKey].filter((m : any) => m.active).map((m : any) => m.item.id)
}

async function saveData(){
    menuStore.fetchDataLoad = true;
    try{
        const modules = Object.values(moduleRegistry)

        for(const mod of modules){
            for(const row of mod.list.value.filter((r : any) => !r.isDeleted)){
                if(!row.selected_tarrif) throw new Error("Validation Error")
                if(!row.selected_contract) throw new Error("Validation Error")
                if(!isValidData(row.item)) throw new Error("Validation Error")
            }
        }

        for(const m of modules){
            const rows = m.list.value as any[]
            const multi = m.multi

            const created = await Promise.all(
                rows.filter(r => r.item.id === 0 && !r.isDeleted).map(async r => {
                    coerceNumeric(r.item, m.numeric)
                    r.item.contract_id = r.selected_contract!.label
                    r.item.tarrif_id = r.selected_tarrif!.label
                    const payload = multi
                        ? { ...r.item, [multi.field] : selectedIds(r, multi.rowKey) }
                        : r.item
                    return m.post(payload)
                })
            )

            const diffs = rows.filter(r => r.item.id !== 0 && !r.isDeleted).map(r => {
                coerceNumeric(r.item, m.numeric)
                const diff : any = diffObject(r.old_item, r.item, false)
                if(r.selected_contract?.label !== r.item.contract_id) diff.contract_id = r.selected_contract?.label
                if(r.selected_tarrif?.label !== r.item.tarrif_id) diff.tarrif_id = r.selected_tarrif?.label
                if(multi && isDiffArraySimple(selectedNames(r, multi.rowKey), r.item[multi.field])){
                    diff[multi.field] = selectedIds(r, multi.rowKey)
                }
                return { id : r.item.id, diff }
            }).filter(d => Object.keys(d.diff).length !== 0)

            const updated = await Promise.all(diffs.map(d => m.patch(d.id, d.diff)))

            const toDelete = rows.filter(r => r.item.id !== 0 && r.isDeleted).map(r => r.item.id)
            await Promise.all(toDelete.map(async (id : number) => {
                if(await m.remove(id)){
                    const idx = m.store.findIndex((i : any) => i.id === id)
                    if(idx > -1) m.store.splice(idx, 1)
                }
            }))

            for(const u of updated){
                const idx = m.store.findIndex((i : any) => i.id === u.id)
                if(idx > -1) m.store[idx] = { ...(u as object) } as { id : number }
            }
            m.store.push(...created.filter(isDefined as (v : unknown) => v is { id : number }))
        }

        toastStore.openToast("Данные сохраненны")
        modalStore.hideModal();
    }catch(e) {
        console.error(e)
        if((e as Error).message === "Validation Error") toastStore.openToast("Не все поля правильно заполнены или заполнены некорректно")
    }
    finally{
        menuStore.fetchDataLoad = false;
    }
}



</script>
<template>
<div class="flex flex-col" ref="scrollContainer">
    <div class="flex flex-col mb-[15px]">
        <h1 class="font-semibold select-none">Тарифный план</h1>
        <span class="text-gray-500 text-sm select-none">Измените, добавте или продлите тарифный план или модули</span>
    </div>
    <div class="flex flex-col gap-[15px]">
        <div class="flex flex-col">
            <div class="block-module blue-hover" @click="openModulsMenu.vats = !openModulsMenu.vats">
                <p class="font-semibold select-none hover-item">ВАТС</p>
                <Icon style="margin-left: auto;" class="hover-item" :icon="openModulsMenu.vats ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
            </div>
            <div class="flex flex-col" v-if="openModulsMenu.vats" :ref="scrollTargets[ModuleEnum.VATS]">
                <div v-for="item in vats" >
                <div class="item-module blue-hover cursor-pointer mt-[10px]" @click="item.active = !item.active" v-if="!item.isDeleted" @mouseleave="item.isEditMenu = false">
                    <div class="flex items-center gap-[20px]">
                        <div @click.stop>
                        <CheckboxRoot v-model="item.item.active" :class="item.item.active ? 'checkbox-active' : 'checkbox-disable'">
                        <CheckboxIndicator>
                            <Icon icon="radix-icons:check" style="color: white;"/>
                        </CheckboxIndicator>
                    </CheckboxRoot>
                        </div>
                    <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 300px;" v-if="!item.isEditName">{{ item.item.title }}</p>
                    <InputBox @keyup.enter="closeEditName(item)" v-model="item.item.title" :resize="false" v-else @click.stop/>
                    </div>
                    <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px; flex: 1">
                        <div>
                            <Icon @click.stop="item.isEditMenu = !item.isEditMenu" icon="material-symbols:more-vert"/>
                            <Transition name="openEditSelector">
                                <div class="menu-edit-container any-white-container" v-show="item.isEditMenu" @click.stop>
                                <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isEditName = true; item.isEditMenu = false">
                                    <Icon icon="mdi:edit" class="text-gray-500 w-4 h-4 hover-item" />
                                    <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                                </div>
                                <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"@click.stop="item.isDeleted = true">
                                    <Icon icon="mdi:trash-outline" class="text-red-500 w-4 h-4" />
                                    <span class="text-red-500 text-sm select-none">Удалить</span>
                                </div>
                            </div>
                            </Transition>
                        </div>
                        <Icon :icon="item.active ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                    </div>
                </div>
                <div class="flex flex-col gap-[10px] px-[15px] mt-[5px]" v-if="item.active && !item.isDeleted">
                    <div class="flex gap-[15px]">
                        
                        <InputBox style="width: 50%; margin-top: auto;" type="number" placeholder="Введите количество" :resize="false" v-model="item.item.additional_users" title="Количество дополнительных пользователей" />
                        <Selector style="width: 50%; margin-top: auto;" title="Период хранения записей разговоров" v-model="item.item.duration" :items="durationList"/>
                    </div>
                    <div class="flex gap-[15px]">
                        <Selector style="width: 50%; margin-top: auto;" title="Тариф" v-model="item.selected_tarrif" :items="tarrifsSelect"/>
                        <InputBox style="width: 50%; margin-top: auto;" type="number" :resize="false" :step="0.01" title="Цена (руб.)" placeholder="Введите цену" v-model="item.item.price" />
                    </div>
                    <div class="flex gap-[10px] " style="align-items: end;">
                        <Selector style="min-width: 90% ;width: 90%;" title="Договор" v-model="item.selected_contract" :items="ContractsSelect"/>
                        <div class="add-tag-box" style="width: 100%; height: 40px;" @click="addContract(item)">
                            <Icon class="h-[15px] w-[15px] hover-item changeable-icon" icon="rivet-icons:plus" />
                        </div>
                    </div>
                </div>
                </div>
                <div class="flex justify-center blue-hover items-center close-btn gap-[10px] mt-[10px] cursor-pointer h-[35px]" @click="addModuleVats()">
                    <Icon class="h-[12px] w-[12px] hover-item" icon="rivet-icons:plus" />
                    <span class="font-semibold select-none hover-item" >Добавить проект</span>
                </div>
            </div>
        </div>
        <div class="flex flex-col">
            <div class="block-module blue-hover" @click="openModulsMenu.voiceRobot = !openModulsMenu.voiceRobot">
                <p class="font-semibold select-none hover-item">Голосовой робот</p>
                <Icon style="margin-left: auto;" class="hover-item" :icon="openModulsMenu.voiceRobot ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
            </div>
            <div class="flex flex-col" v-if="openModulsMenu.voiceRobot" :ref="scrollTargets[ModuleEnum.VOICE_ROBOT]">
                <!-- изменить if на show -->
                <div v-for="item in voiceRobotComputed">
                    <div class="item-module blue-hover cursor-pointer mt-[10px]" @click="item.active = !item.active" v-if="!item.isDeleted" @mouseleave="item.isEditMenu = false">
                    <div class="flex items-center gap-[20px]">
                        <div @click.stop>
                        <CheckboxRoot v-model="item.item.active" :class="item.item.active ? 'checkbox-active' : 'checkbox-disable'">
                        <CheckboxIndicator>
                            <Icon icon="radix-icons:check" style="color: white;"/>
                        </CheckboxIndicator>
                    </CheckboxRoot>
                        </div>
                    <span v-if="!item.isEditName">{{ item.item.title }}</span>
                    <InputBox @keyup.enter="closeEditName(item)" v-model="item.item.title" :resize="false" v-else @click.stop/>
                    </div>
                    <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                        <div>
                            <Icon @click.stop="item.isEditMenu = !item.isEditMenu" icon="material-symbols:more-vert"/>
                            <Transition name="openEditSelector">
                                <div class="menu-edit-container any-white-container" v-show="item.isEditMenu" @click.stop>
                                <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isEditName = true; item.isEditMenu = false">
                                    <Icon icon="mdi:edit" class="text-gray-500 w-4 h-4 hover-item" />
                                    <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                                </div>
                                <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isDeleted = true">
                                    <Icon icon="mdi:trash-outline" class="text-red-500 w-4 h-4" />
                                    <span class="text-red-500 text-sm select-none">Удалить</span>
                                </div>
                            </div>
                            </Transition>
                        </div>
                        <Icon :icon="item.active ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                    </div>
                </div>
                    <div class="flex flex-col gap-[10px] px-[15px] mt-[5px]" v-if="item.active && !item.isDeleted">
                    <div class="flex gap-[15px]">
                        <Selector style="width: 50%; margin-top: auto;" title="Тариф" v-model="item.selected_tarrif" :items="tarrifsSelect"/>
                        <InputBox style="width: 50%; margin-top: auto;" type="number" placeholder="Введите количество" :resize="false" v-model="item.item.lines" title="Количество линий" />
                    </div>
                    <div class="flex">
                        <InputBox style="width: 50%; margin-top: auto;" type="number" :resize="false" :step="0.01" title="Цена (руб.)" placeholder="Введите цену" v-model="item.item.price" />
                    </div>
                    <div class="flex gap-[10px] " style="align-items: end;">
                        <Selector style="min-width: 90% ;width: 90%;" title="Договор" v-model="item.selected_contract" :items="ContractsSelect"/>
                        <div class="add-tag-box" style="width: 100%; height: 40px;" @click="addContract(item)">
                            <Icon class="h-[15px] w-[15px] hover-item changeable-icon" icon="rivet-icons:plus" />
                        </div>
                    </div>
                </div>
                </div>
                <div class="flex justify-center blue-hover items-center close-btn gap-[10px] mt-[10px] cursor-pointer h-[35px]"@click="addModuleVoiceRobot()">
                    <Icon class="h-[12px] w-[12px] hover-item" icon="rivet-icons:plus" />
                    <span class="font-semibold select-none hover-item">Добавить проект</span>
                </div>
            </div>
            </div>
        <div class="flex flex-col">
            <div class="block-module blue-hover" @click="openModulsMenu.chatBot = !openModulsMenu.chatBot">
                <p class="font-semibold select-none hover-item">Чат-бот</p>
                <Icon style="margin-left: auto;" class="hover-item" :icon="openModulsMenu.chatBot ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
            </div>
            <div class="flex flex-col" v-if="openModulsMenu.chatBot" :ref="scrollTargets[ModuleEnum.CHAT_BOT]">
                <div v-for="item in chatBotComputed">
                    <div class="item-module blue-hover cursor-pointer mt-[10px]" @click="item.active = !item.active" v-if="!item.isDeleted" @mouseleave="item.isEditMenu = false">
                    <div class="flex items-center gap-[20px]">
                        <div @click.stop>
                        <CheckboxRoot v-model="item.item.active" :class="item.item.active ? 'checkbox-active' : 'checkbox-disable'">
                        <CheckboxIndicator>
                            <Icon icon="radix-icons:check" style="color: white;"/>
                        </CheckboxIndicator>
                    </CheckboxRoot>
                        </div>
                    <span v-if="!item.isEditName">{{ item.item.title }}</span>
                    <InputBox @keyup.enter="closeEditName(item)" v-model="item.item.title" :resize="false" v-else @click.stop/>
                    </div>
                    <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                        <div>
                            <Icon @click.stop="item.isEditMenu = !item.isEditMenu" icon="material-symbols:more-vert"/>
                            <Transition name="openEditSelector">
                                <div class="menu-edit-container any-white-container" v-show="item.isEditMenu" @click.stop>
                                <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isEditName = true; item.isEditMenu = false">
                                    <Icon icon="mdi:edit" class="text-gray-500 w-4 h-4 hover-item" />
                                    <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                                </div>
                                <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isDeleted = true">
                                    <Icon icon="mdi:trash-outline" class="text-red-500 w-4 h-4" />
                                    <span class="text-red-500 text-sm select-none">Удалить</span>
                                </div>
                            </div>
                            </Transition>
                        </div>
                        <Icon :icon="item.active ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                    </div>
                </div>
                    <div class="flex flex-col gap-[10px] px-[15px] mt-[5px]" v-if="item.active && !item.isDeleted">
                    <div class="flex gap-[15px]">
                        <Selector style="width: 33%; margin-top: auto;" title="Тариф" v-model="item.selected_tarrif" :items="tarrifsSelect"/>
                        <InputBox style="width: 33%; margin-top: auto;" type="number" placeholder="Введите количество" :resize="false" v-model="item.item.lines_count" title="Количество линий" />
                        <div class="flex flex-col gap-[5px]" style="width: 33%; position: relative;">
                            <span class="select-none font-semibold text-sm">Мессенджеры</span>
                            <div>
                                <div class="close-btn blue-hover flex justify-center items-center px-[5px] py-[10px] ga" style="height: 40px;" @click="item.active_messengers = !item.active_messengers">
                                    <span class="hover-item font-semibold select-none text-sm" style="white-space: nowrap; width: 80%; text-overflow: ellipsis; overflow: hidden;">Выберите мессенджеры</span>
                                    <Icon icon="radix-icons:chevron-down" class="hover-item" style="margin-left: auto;"/>
                                </div>
                            </div>
                            <div class="absolutepostion-grid" v-if="item.active_messengers">
                                <div class="moreactions-panel">
                                    <div class="flex items-center px-[5px] py-[5px] gap-[5px]" v-for="messengers in item.messengers">
                                        <CheckboxRoot v-model="messengers.active" :class="messengers.active ? 'checkbox-active' : 'checkbox-disable'">
                                            <CheckboxIndicator>
                                                <Icon icon="radix-icons:check" style="color: white;"/>
                                            </CheckboxIndicator>
                                        </CheckboxRoot>
                                        <span>{{ messengers.item.name }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tags-container">
                        <div class="tag-box" v-for="mess in item.messengers.filter(m => m.active)">
                            <span style="font-size: 0.7em;" class="cursor-default font-semibold">{{mess.item.name}}</span>
                            <Icon  icon="maki:cross" class="w-2.5 h-2.5 hover-red" @click="mess.active = false"/>
                        </div>
                    </div>
                    <div class="flex">
                        <InputBox style="width: 50%; margin-top: auto;" type="number" :resize="false" :step="0.01" title="Цена (руб.)" placeholder="Введите цену" v-model="item.item.price" />
                    </div>
                    <div class="flex gap-[10px] " style="align-items: end;">
                        <Selector style="min-width: 90% ;width: 90%;" title="Договор" v-model="item.selected_contract" :items="ContractsSelect"/>
                        <div class="add-tag-box" style="width: 100%; height: 40px;" @click="addContract(item)">
                            <Icon class="h-[15px] w-[15px] hover-item changeable-icon" icon="rivet-icons:plus" />
                        </div>
                    </div>
                    </div>
                </div>
                <div class="flex justify-center blue-hover items-center close-btn gap-[10px] mt-[10px] cursor-pointer h-[35px]"@click="addModuleChatBot()">
                    <Icon class="h-[12px] w-[12px] hover-item" icon="rivet-icons:plus" />
                    <span class="font-semibold select-none hover-item">Добавить проект</span>
                </div>
            </div>
        </div>
        <div class="flex flex-col">
            <div class="block-module blue-hover" @click="openModulsMenu.autoinfo = !openModulsMenu.autoinfo" >
                <p class="font-semibold select-none hover-item">Автоинформирование</p>
                <Icon style="margin-left: auto;" class="hover-item" :icon="openModulsMenu.autoinfo ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
            </div>
            <div class="flex flex-col" v-if="openModulsMenu.autoinfo" :ref="scrollTargets[ModuleEnum.AUTOINFORMATION]">
                    <div class="item-module blue-hover cursor-pointer mt-[15px]" @click="openModulsMenu.autoinfo_with_voice = !openModulsMenu.autoinfo_with_voice">
                        <div class="flex items-center gap-[20px]">
                        <span class="select-none">Исходящие звонки с разпознования речи</span>
                        </div>
                        <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                            <Icon :icon="openModulsMenu.autoinfo_with_voice ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                        </div>
                    </div>
                    <div class="flex flex-col px-[10px]" v-if="openModulsMenu.autoinfo_with_voice">
                        <div v-for="item in autoInfoComputed.filter(o => o.item.type_id === 1)">
                            <div class="item-module blue-hover cursor-pointer mt-[10px]" @click="item.active = !item.active" v-if="!item.isDeleted" @mouseleave="item.isEditMenu = false">
                                <div class="flex items-center gap-[20px]">
                                    <div @click.stop>
                                    <CheckboxRoot v-model="item.item.active" :class="item.item.active ? 'checkbox-active' : 'checkbox-disable'">
                                    <CheckboxIndicator>
                                        <Icon icon="radix-icons:check" style="color: white;"/>
                                    </CheckboxIndicator>
                                </CheckboxRoot>
                                    </div>
                                <span v-if="!item.isEditName">{{ item.item.title }}</span>
                                <InputBox @keyup.enter="closeEditName(item)" v-model="item.item.title" :resize="false" v-else @click.stop/>
                                </div>
                                <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                                    <div>
                                        <Icon @click.stop="item.isEditMenu = !item.isEditMenu" icon="material-symbols:more-vert"/>
                                        <Transition name="openEditSelector">
                                            <div class="menu-edit-container any-white-container" v-show="item.isEditMenu" @click.stop>
                                            <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isEditName = true; item.isEditMenu = false">
                                                <Icon icon="mdi:edit" class="text-gray-500 w-4 h-4 hover-item" />
                                                <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                                            </div>
                                            <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isDeleted = true">
                                                <Icon icon="mdi:trash-outline" class="text-red-500 w-4 h-4" />
                                                <span class="text-red-500 text-sm select-none">Удалить</span>
                                            </div>
                                        </div>
                                        </Transition>
                                    </div>
                                    <Icon :icon="item.active ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                                </div>
                            </div>
                            <div class="flex flex-col gap-[10px] px-[15px] mt-[5px]" v-if="item.active && !item.isDeleted" >
                                <div class="flex gap-[15px]">
                                    <Selector style="width: 35%; margin-top: auto;" title="Тариф" v-model="item.selected_tarrif" :items="tarrifsSelect"/>
                                    <InputBox style="width: 31%; margin-top: auto;" type="number" :resize="false" :step="0.01" title="Цена (руб.)" placeholder="Введите цену" v-model="item.item.price" />
                                    <InputBox style="width: 31%; margin-top: auto;" type="number" title="Количество" placeholder="Введите кол-во" v-model="item.item.quantity" />
                                </div>
                            <div class="flex gap-[10px] " style="align-items: end;">
                                <Selector style="min-width: 90% ;width: 90%;" title="Договор" v-model="item.selected_contract" :items="ContractsSelect"/>
                                <div class="add-tag-box" style="width: 100%; height: 40px;" @click="addContract(item)">
                                    <Icon class="h-[15px] w-[15px] hover-item changeable-icon" icon="rivet-icons:plus" />
                                </div>
                            </div>
                            </div>
                        </div>
                        <div class="flex justify-center blue-hover items-center close-btn gap-[10px] mt-[10px] cursor-pointer h-[35px]" @click="addModuleAutoInfromation(1)">
                            <Icon class="h-[12px] w-[12px] hover-item" icon="rivet-icons:plus" />
                            <span class="font-semibold select-none hover-item">Добавить проект</span>
                        </div>
                    </div>
                    <div class="item-module blue-hover cursor-pointer mt-[15px]" @click="openModulsMenu.autoinfo_without_voice = !openModulsMenu.autoinfo_without_voice">
                        <div class="flex items-center gap-[20px]">
                        <span class="select-none">Исходящие звонки без разпознования речи</span>
                    </div>
                    <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                        <Icon :icon="openModulsMenu.autoinfo_without_voice ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                    </div>
                </div>
                <div class="flex flex-col px-[10px]" v-if="openModulsMenu.autoinfo_without_voice">
                    <div v-for="item in autoInfoComputed.filter(o => o.item.type_id === 2)">
                        <div class="item-module blue-hover cursor-pointer mt-[10px]" @click="item.active = !item.active" v-if="!item.isDeleted" @mouseleave="item.isEditMenu = false">
                            <div class="flex items-center gap-[20px]">
                                <div @click.stop>
                                <CheckboxRoot v-model="item.item.active" :class="item.item.active ? 'checkbox-active' : 'checkbox-disable'">
                                <CheckboxIndicator>
                                    <Icon icon="radix-icons:check" style="color: white;"/>
                                </CheckboxIndicator>
                            </CheckboxRoot>
                                </div>
                            <span v-if="!item.isEditName">{{ item.item.title }}</span>
                            <InputBox @keyup.enter="closeEditName(item)" v-model="item.item.title" :resize="false" v-else @click.stop/>
                            </div>
                            <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                                <div>
                                    <Icon @click.stop="item.isEditMenu = !item.isEditMenu" icon="material-symbols:more-vert"/>
                                    <Transition name="openEditSelector">
                                        <div class="menu-edit-container any-white-container" v-show="item.isEditMenu" @click.stop>
                                        <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isEditName = true; item.isEditMenu = false">
                                            <Icon icon="mdi:edit" class="text-gray-500 w-4 h-4 hover-item" />
                                            <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                                        </div>
                                        <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isDeleted = true">
                                            <Icon icon="mdi:trash-outline" class="text-red-500 w-4 h-4" />
                                            <span class="text-red-500 text-sm select-none">Удалить</span>
                                        </div>
                                    </div>
                                    </Transition>
                                </div>
                                <Icon :icon="item.active ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                            </div>
                        </div>
                        <div class="flex flex-col gap-[10px] px-[15px] mt-[5px]" v-if="item.active && !item.isDeleted">
                            <div class="flex gap-[15px]">
                                <Selector style="width: 35%; margin-top: auto;" title="Тариф" v-model="item.selected_tarrif" :items="tarrifsSelect"/>
                                <InputBox style="width: 31%; margin-top: auto;" type="number" :resize="false" :step="0.01" title="Цена (руб.)" placeholder="Введите цену" v-model="item.item.price" />
                                <InputBox style="width: 31%; margin-top: auto;" type="number" title="Количество" placeholder="Введите кол-во" v-model="item.item.quantity" />
                            </div>
                        <div class="flex gap-[10px] " style="align-items: end;">
                            <Selector style="min-width: 90% ;width: 90%;" title="Договор" v-model="item.selected_contract" :items="ContractsSelect"/>
                            <div class="add-tag-box" style="width: 100%; height: 40px;" @click="addContract(item)">
                                <Icon class="h-[15px] w-[15px] hover-item changeable-icon" icon="rivet-icons:plus" />
                            </div>
                        </div>
                        </div>
                    </div>
                    <div class="flex justify-center blue-hover items-center close-btn gap-[10px] mt-[10px] cursor-pointer h-[35px]" @click="addModuleAutoInfromation(2)">
                        <Icon class="h-[12px] w-[12px] hover-item" icon="rivet-icons:plus" />
                        <span class="font-semibold select-none hover-item">Добавить проект</span>
                    </div>
                </div>
                <div class="item-module blue-hover cursor-pointer mt-[15px]" @click="openModulsMenu.autoinfo_sms = !openModulsMenu.autoinfo_sms">
                    <div class="flex items-center gap-[20px]">
                    <span class="select-none">SMS</span>
                    </div>
                    <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                        <Icon :icon="openModulsMenu.autoinfo_sms ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                    </div>
                </div>
                <div class="flex flex-col px-[10px]" v-if="openModulsMenu.autoinfo_sms">
                    <div v-for="item in autoInfoComputed.filter(o => o.item.type_id === 3)">
                        <div class="item-module blue-hover cursor-pointer mt-[10px]" @click="item.active = !item.active" v-if="!item.isDeleted" @mouseleave="item.isEditMenu = false">
                            <div class="flex items-center gap-[20px]">
                                <div @click.stop>
                                <CheckboxRoot v-model="item.item.active" :class="item.item.active ? 'checkbox-active' : 'checkbox-disable'">
                                <CheckboxIndicator>
                                    <Icon icon="radix-icons:check" style="color: white;"/>
                                </CheckboxIndicator>
                            </CheckboxRoot>
                                </div>
                            <span v-if="!item.isEditName">{{ item.item.title }}</span>
                            <InputBox @keyup.enter="closeEditName(item)" v-model="item.item.title" :resize="false" v-else @click.stop/>
                            </div>
                            <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                                <div>
                                    <Icon @click.stop="item.isEditMenu = !item.isEditMenu" icon="material-symbols:more-vert"/>
                                    <Transition name="openEditSelector">
                                        <div class="menu-edit-container any-white-container" v-show="item.isEditMenu" @click.stop>
                                        <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isEditName = true; item.isEditMenu = false">
                                            <Icon icon="mdi:edit" class="text-gray-500 w-4 h-4 hover-item" />
                                            <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                                        </div>
                                        <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isDeleted = true">
                                            <Icon icon="mdi:trash-outline" class="text-red-500 w-4 h-4" />
                                            <span class="text-red-500 text-sm select-none">Удалить</span>
                                        </div>
                                    </div>
                                    </Transition>
                                </div>
                                <Icon :icon="item.active ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                            </div>
                        </div>
                        <div class="flex flex-col gap-[10px] px-[15px] mt-[5px]" v-if="item.active && !item.isDeleted">
                            <div class="flex gap-[15px]">
                                <Selector style="width: 35%; margin-top: auto;" title="Тариф" v-model="item.selected_tarrif" :items="tarrifsSelect"/>
                                <InputBox style="width: 31%; margin-top: auto;" type="number" :resize="false" :step="0.01" title="Цена (руб.)" placeholder="Введите цену" v-model="item.item.price" />
                                <InputBox style="width: 31%; margin-top: auto;" type="number" title="Количество" placeholder="Введите кол-во" v-model="item.item.quantity" />
                            </div>
                            <div class="flex gap-[10px] " style="align-items: end;">
                                <Selector style="min-width: 90% ;width: 90%;" title="Договор" v-model="item.selected_contract" :items="ContractsSelect"/>
                                <div class="add-tag-box" style="width: 100%; height: 40px;" @click="addContract(item)">
                                    <Icon class="h-[15px] w-[15px] hover-item changeable-icon" icon="rivet-icons:plus" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-center blue-hover items-center close-btn gap-[10px] mt-[10px] cursor-pointer h-[35px]" @click="addModuleAutoInfromation(3)">
                        <Icon class="h-[12px] w-[12px] hover-item" icon="rivet-icons:plus" />
                        <span class="font-semibold select-none hover-item">Добавить проект</span>
                    </div>
                </div>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="block-module blue-hover" @click="openModulsMenu.webForm = !openModulsMenu.webForm">
            <p class="font-semibold select-none hover-item">Web-форма</p>
            <Icon style="margin-left: auto;" class="hover-item" :icon="openModulsMenu.webForm ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
        </div>
        <div class="flex flex-col" v-if="openModulsMenu.webForm" :ref="scrollTargets[ModuleEnum.WEBFORM]">
            <div v-for="item in webFormsComputed">
                <div class="item-module blue-hover cursor-pointer mt-[10px]" @click="item.active = !item.active" v-if="!item.isDeleted" @mouseleave="item.isEditMenu = false">
                    <div class="flex items-center gap-[20px]">
                        <div @click.stop>
                        <CheckboxRoot v-model="item.item.active" :class="item.item.active ? 'checkbox-active' : 'checkbox-disable'">
                        <CheckboxIndicator>
                            <Icon icon="radix-icons:check" style="color: white;"/>
                        </CheckboxIndicator>
                    </CheckboxRoot>
                        </div>
                    <span v-if="!item.isEditName">{{ item.item.title }}</span>
                    <InputBox @keyup.enter="closeEditName(item)" v-model="item.item.title" :resize="false" v-else @click.stop/>
                    </div>
                    <div style="display: flex; flex-direction: row-reverse; margin-left: auto; gap: 10px;">
                        <div>
                            <Icon @click.stop="item.isEditMenu = !item.isEditMenu" icon="material-symbols:more-vert"/>
                            <Transition name="openEditSelector">
                                <div class="menu-edit-container any-white-container" v-show="item.isEditMenu" @click.stop>
                                <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isEditName = true; item.isEditMenu = false">
                                    <Icon icon="mdi:edit" class="text-gray-500 w-4 h-4 hover-item" />
                                    <span class="text-gray-500 text-sm select-none hover-item">Изменить</span>
                                </div>
                                <div class="flex gap-2 py-1 px-2 blue-hover p-[2px] h-8 items-center"  @click.stop="item.isDeleted = true">
                                    <Icon icon="mdi:trash-outline" class="text-red-500 w-4 h-4" />
                                    <span class="text-red-500 text-sm select-none">Удалить</span>
                                </div>
                            </div>
                            </Transition>
                        </div>
                        <Icon :icon="item.active ? 'radix-icons:chevron-up' : 'radix-icons:chevron-down'"/>
                    </div>
                </div>
                <div class="flex flex-col gap-[10px] px-[15px] mt-[5px]" v-if="item.active && !item.isDeleted">
                <div class="flex gap-[15px]">
                    <Selector style="width: 33%; margin-top: auto;" title="Тариф" v-model="item.selected_tarrif" :items="tarrifsSelect"/>
                    <InputBox style="width: 33%; margin-top: auto;" type="number" :resize="false" :step="0.01" title="Цена (руб.)" placeholder="Введите цену" v-model="item.item.price" />
                    <div class="flex flex-col gap-[5px]" style="width: 33%; position: relative;">
                        <span class="select-none font-semibold text-sm">Интеграции</span>
                        <div>
                            <div class="close-btn blue-hover flex justify-center items-center px-[5px] py-[10px] ga" style="height: 40px;" @click="item.acitve_integrations = !item.acitve_integrations">
                                <span class="hover-item font-semibold select-none text-sm" style="white-space: nowrap; width: 80%; text-overflow: ellipsis; overflow: hidden;">Выберите интеграцию</span>
                                <Icon icon="radix-icons:chevron-down" class="hover-item" style="margin-left: auto;"/>
                            </div>
                        </div>
                        <div class="absolutepostion-grid" v-if="item.acitve_integrations">
                            <div class="moreactions-panel">
                                <div class="flex items-center px-[5px] py-[5px] gap-[5px]" v-for="messengers in item.integrations">
                                    <CheckboxRoot v-model="messengers.active" :class="messengers.active ? 'checkbox-active' : 'checkbox-disable'">
                                        <CheckboxIndicator>
                                            <Icon icon="radix-icons:check" style="color: white;"/>
                                        </CheckboxIndicator>
                                    </CheckboxRoot>
                                    <span>{{ messengers.item.name }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tags-container">
                    <div class="tag-box" v-for="mess in item.integrations.filter(m => m.active)">
                        <span style="font-size: 0.7em;" class="cursor-default font-semibold">{{mess.item.name}}</span>
                        <Icon  icon="maki:cross" class="w-2.5 h-2.5 hover-red" @click="mess.active = false"/>
                    </div>
                </div>
                    <div class="flex gap-[10px] " style="align-items: end;">
                        <Selector style="min-width: 90% ;width: 90%;" title="Договор" v-model="item.selected_contract" :items="ContractsSelect"/>
                        <div class="add-tag-box" style="width: 100%; height: 40px;" @click="addContract(item)">
                            <Icon class="h-[15px] w-[15px] hover-item changeable-icon" icon="rivet-icons:plus" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-center blue-hover items-center close-btn gap-[10px] mt-[10px] cursor-pointer h-[35px]" @click="addModuleWebForm()">
                <Icon class="h-[12px] w-[12px] hover-item" icon="rivet-icons:plus" />
                <span class="font-semibold select-none hover-item">Добавить проект</span>
            </div>
        </div>
    </div>
    <div>
        <div class="flex mt-[35px] gap-[20px]" style="margin-left: auto; width: 50%; flex-direction: row-reverse;">
            <div class="save-btn blue-hover justify-center items-center px-[10px] py-[8px]"  @click="saveData()">
                <p class="select-none hover-item text-sm" style="color: white;">Сохранить измения</p>
            </div>
            <div class="close-btn blue-hover justify-center items-center px-[10px] py-[8px]" @click="modalStore.hideModal()">
                <p class="select-none hover-item text-sm">Отмена</p>
            </div>
        </div>
    </div>
</div>
</div>
</template>
<style>
@import '~/assets/css/any-container.css';

.save-btn{
    background: #3182ce;
    border-radius: 5px;
}

.tags-container{
    display: flex;
    flex-wrap: wrap;
    gap: 10px
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

.add-tag-box:hover {
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.add-tag-box:hover .changeable-icon{
    color: #437db4;
    transition: color 0.15s ease;
}

.tag-box{
    padding: 3px 8px;
    display: flex;
    height: fit-content;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #edf2f7;
    border-color: #eaeff5;
    gap: 5px;
    border-width: 1.5px;
} 
.menu-edit-container{
    position: absolute;
    bottom: 1;
    right: 3%;
    z-index: 10;
    height: fit-content;
    width: fit-content;
}

.absolutepostion-grid{
  height: max-content;
  width: max-content;
  position: absolute;
  top: 100%;
  z-index: 9999999999999;
}

.moreactions-panel{
  border: 1px solid rgba(0, 0, 0, 0.06);
  background:  white;
  border-radius: 10px;
  height: max-content;
  width: 200px;
}

.checkbox-disable{
    background-color: #edf2f7;
    border-color: #e7eaee;
    border-width: 1.0px;
    border-radius: 5px;
    display: flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
}
.checkbox-active{
    background-color: #3182ce;
    border-color: #e7eaee;
    border-width: 1.0px;
    border-radius: 5px;
    display: flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
}

.close-btn{
    border-color: #e7eaee;
    border-width: 1.5px;
    border-radius: 5px;
}
.item-module{
    display: flex;
    height: 38px;
    align-items: center;
    border-radius: 5px;
    padding: 10px;
}
.block-module{
    height: 40px;
    padding: 10px;
    display: flex;
    align-items: center;
    border-color: #d9dbdf;
    border-width: 1.5px;
    border-radius: 8px;
}
.blue-hover:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.blue-hover:hover .hover-item{
    color: #437db4;
    transition: color 0.15s cubic-bezier(0.16, 1, 0.3,);
}
.save-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}
.hover-red:hover{
    color: red;
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