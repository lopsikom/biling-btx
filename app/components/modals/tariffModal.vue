<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { IAutoinformation, IChatBot, IChatBotPost, IContract, IVats, IVoiceRobot, IWebform, IWebformPost } from '~~/shared/models/APIModels';
import InputBox from '../InputBox.vue';
import Selector from '../Selector.vue';
import type { SelectorObject } from '~/services/models';
import usebillingStateStore from '~/services/stores/billingStateStore';
import useModalStore from '~/services/stores/modalStore';
import { diffObject, isDiffArraySimple, isValidData } from '~/services/utils/utils';
import useToastStore from '~/services/stores/toastStore';
import { ModalEnum } from '~/services/models/enums/billing/ModalsEnum';
import useMenuStore from '~/services/stores/menuStores';
const openModulsMenu = ref({
    vats : false,
    voiceRobot : false,
    chatBot : false,
    autoinfo : false,
    autoinfo_with_voice : false,
    autoinfo_without_voice : false,
    autoinfo_sms : false,
    webForm : false
})

onMounted(async () => {
    const data = await $axios.getContracts({});
    billingStateStore.contractsTariff = data;
    const ContractsSelect = billingStateStore.contractsTariff
        .filter(c => c.status !== "Завершен" && c.status !== "Приостановлен")
        .map(c => ({
        label: c.id,
        value: `${c.name} ${c.index ?? ''} ${c.org_name} ${c.status} от ${new Date(c.date_begin).toLocaleDateString()}`
    }))
    voiceRobotComputed.value.forEach(v => {
        v.selected_contract = ContractsSelect.find(c => c.label === v.old_item.contract_id)
    })
    vats.value.forEach(v => {
        v.selected_contract = ContractsSelect.find(c => c.label === v.old_item.contract_id)
    })
    chatBotComputed.value.forEach(v => {
        v.selected_contract = ContractsSelect.find(c => c.label === v.old_item.contract_id)
    })
    webFormsComputed.value.forEach(v => {
        v.selected_contract = ContractsSelect.find(c => c.label === v.old_item.contract_id)
    })
    autoInfoComputed.value.forEach(v => {
        v.selected_contract = ContractsSelect.find(c => c.label === v.old_item.contract_id)
    })

})

const toastStore = useToastStore()

const {$axios} = useNuxtApp()

const modalStore = useModalStore()

const menuStore = useMenuStore();

const billingStateStore = usebillingStateStore();

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

const voiceRobotComputed = ref(billingStateStore.voiceRobots.map(v => {
    return {
        item : structuredClone(toRaw(v)),
        old_item : v,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === v.tarrif_id),
        selected_contract : ContractsSelect.value.find(o => o?.label === v.contract_id),
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    }
}))

const chatBotComputed = ref(billingStateStore.chatBots.map(m => {
    return {
        item : structuredClone(toRaw(m)),
        old_item : m,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === m.tarrif_id),
        selected_contract : ContractsSelect.value.find(o => o?.label === m.contract_id),
        messengers : billingStateStore.messengers.map(s => {
            return {
                item : s,
                active : m.messengers.find(i => s.name === i) ? true : false
            }
        }),
        active_messengers : false,
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    }
}))
const webFormsComputed = ref(billingStateStore.webform.map(w => {
    return {
        item : structuredClone(toRaw(w)),
        old_item : w,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === w.tarrif_id),
        selected_contract : ContractsSelect.value.find(o => o?.label === w.contract_id),
        integrations : billingStateStore.integrations.map(i => {
            return {
                item : i,
                active : w.integrations.find(ii => ii === i.name) ? true : false
            }
        }),
        acitve_integrations : false,
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    }
}))

const autoInfoComputed = ref(billingStateStore.autoinformations.map(w => {
    return {
        item : structuredClone(toRaw(w)),
        old_item : w,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === w.tarrif_id),
        selected_contract : ContractsSelect.value.find(o => o?.label === w.contract_id),
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    }
}))


const vats = ref(billingStateStore.vats.map(v => {
    return {
        item : structuredClone(toRaw(v)),
        old_item : v,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === v.tarrif_id),
        selected_contract : ContractsSelect.value.find(o => o?.label === v.contract_id),
        active : false,
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    }
}))
function addModuleVats(){   
    const item = {
            id : 0,
            contract_id : 0,
            tarrif_id : 1,
            additional_users : 0,
            duration : 0,
            title : "ВАТС",
            active : false,
            price : 0
        }
    vats.value.push({
        item : item,
        old_item : item,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === 1),
        selected_contract : ContractsSelect.value.find(o => o?.label === 0),
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    })
}

function addModuleChatBot(){
    const item = {
            id : 0,
            contract_id : 0,
            tarrif_id : 1,
            title : "Чат бот",
            lines_count : 0,
            active : false,
            price : 0,
            messengers : []
        }
    chatBotComputed.value.push({
        item : item,
        old_item : item,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === 1),
        selected_contract : ContractsSelect.value.find(o => o?.label === 0),
        messengers : billingStateStore.messengers.map(s => {
            return {
                item : s,
                active : false
            }
        }),
        active_messengers : false,
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    })
}
function addModuleVoiceRobot(){
    const item = {
            id : 0,
            contract_id : 0,
            title : "Голосовой робот",
            active : false,
            price : 0,
            lines : 0,
            tarrif_id : 1,
        }
    voiceRobotComputed.value.push({
        item : item,
        old_item : item,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === 1),
        selected_contract : ContractsSelect.value.find(o => o?.label === 0),
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    })
}
function addModuleWebForm(){
    const item = {
            id : 0,
            contract_id : 0,
            tarrif_id : 1,
            title : "Веб-форма",
            active : false,
            price : 0,
            integrations : []
        }
    webFormsComputed.value.push({
        item : item,
        old_item : item,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === 1),
        selected_contract : ContractsSelect.value.find(o => o?.label === 0),
        integrations : billingStateStore.integrations.map(s => {
            return {
                item : s,
                active : false
            }
        }),
        acitve_integrations : false,
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    })
}
function addModuleAutoInfromation(type_id : number){
    const item = {
            id : 0,
            contract_id : 0,
            type_id : type_id,
            title : "Автоинформирование",
            active : false,
            price : 0,
            quantity : 0,
            tarrif_id : 1,
        }
    autoInfoComputed.value.push({
        item : item,
        old_item : item,
        active : false,
        selected_tarrif :tarrifsSelect.value.find(t => t.label === 1),
        selected_contract : ContractsSelect.value.find(o => o?.label === 0),
        isDeleted : false,
        isEditName : false,
        isEditMenu : false
    })
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

async function saveData(){ //Дальнейший рефактор получения различий
    menuStore.fetchDataLoad = true;
    try{
        
    const allModules = [...vats.value, ...voiceRobotComputed.value, ...autoInfoComputed.value, ...chatBotComputed.value, ...webFormsComputed.value]

    for(const i of allModules.filter(m => !m.isDeleted)){
        if(!i.selected_tarrif) throw new Error("Validation Error")
        if(!i.selected_contract) throw new Error("Validation Error")
        if(!isValidData(i.item)) throw new Error("Validation Error")
    }

    const delVats = vats.value.filter(v => v.item.id != 0 && v.isDeleted).map(m => m.item.id)
    const delVoiceRobot = voiceRobotComputed.value.filter(v => v.item.id != 0 && v.isDeleted).map(m => m.item.id)
    const delChatBot = chatBotComputed.value.filter(v => v.item.id != 0 && v.isDeleted).map(m => m.item.id)
    const delAutoInfo = autoInfoComputed.value.filter(v => v.item.id != 0 && v.isDeleted).map(m => m.item.id)
    const delWebForm = webFormsComputed.value.filter(v => v.item.id != 0 && v.isDeleted).map(m => m.item.id)

    const vat = (await Promise.all(vats.value.filter(v => v.item.id === 0 && !v.isDeleted).map(async v => {
        
        v.item.additional_users = parseInt(v.item.additional_users.toString())
        if(!v.selected_tarrif) throw new Error("Contract not selected")
        if(!v.selected_contract) throw new Error("Contract not selected")
        v.item.contract_id = v.selected_contract?.label;
        v.item.tarrif_id = v.selected_tarrif?.label;
        return await $axios.postVats(v.item);
    })))
    const voiceRobot = await Promise.all(voiceRobotComputed.value.filter(v => v.item.id === 0 && !v.isDeleted).map(async v => {
        
        v.item.lines = parseInt(v.item.lines.toString())        
        if(!v.selected_contract) throw new Error("Contract not selected")
        if(!v.selected_tarrif) throw new Error("Contract not selected")
        v.item.contract_id = v.selected_contract?.label;
        v.item.tarrif_id = v.selected_tarrif?.label;
        return await $axios.postVoiceRobot(v.item);
    }))
    const chatBot = await Promise.all(chatBotComputed.value.filter(v => v.item.id === 0 && !v.isDeleted).map(async v => {
        
        v.item.lines_count = parseInt(v.item.lines_count.toString());
        if(!v.selected_contract) throw new Error("Contract not selected")
        if(!v.selected_tarrif) throw new Error("Contract not selected")
        v.item.contract_id = v.selected_contract?.label;
        v.item.tarrif_id = v.selected_tarrif?.label;
        const data = {
            ...v.item,
            messengers : v.messengers.filter(m => m.active).map(m => m.item.id)
        } as IChatBotPost
        return await $axios.postChatBots(data);
    }))
    const autoinfo = await Promise.all(autoInfoComputed.value.filter(v => v.item.id === 0 && !v.isDeleted).map(async v => {
        
        v.item.quantity = parseInt(v.item.quantity.toString())
        if(!v.selected_tarrif) throw new Error("Contract not selected")
        if(!v.selected_contract) throw new Error("Contract not selected")
        v.item.contract_id = v.selected_contract?.label;
        v.item.tarrif_id = v.selected_tarrif?.label;
        return await $axios.postAutoInfo(v.item);
    }))
    const webForm = await Promise.all(webFormsComputed.value.filter(v => v.item.id === 0 && !v.isDeleted).map(async v => {
        
        if(!v.selected_tarrif) throw new Error("Contract not selected")
        if(!v.selected_contract) throw new Error("Contract not selected")
        v.item.contract_id = v.selected_contract?.label;
        v.item.tarrif_id = v.selected_tarrif?.label;
        const data = {
            ...v.item,
            integrations : v.integrations.filter(m => m.active).map(m => m.item.id)
        } as IWebformPost
        console.log(data);
        return await $axios.postWebform(data);
    }))


 
    const diffVats = vats.value.filter(v => v.item.id != 0 && !v.isDeleted).map(v => {
        
        v.item.additional_users = parseInt(v.item.additional_users.toString())
        console.log(v.item.price)
        const diff = diffObject(v.old_item, v.item, false);
        console.log(diff)
        if(v.selected_contract?.label !== v.item.contract_id) diff.contract_id = v.selected_contract?.label 
        if(v.selected_tarrif?.label !== v.item.tarrif_id) diff.tarrif_id = v.selected_tarrif?.label
        return {id : v.item.id, item : diff}
    })
    console.log(diffVats)
    const diffVoiceRobot = voiceRobotComputed.value.filter(v => v.item.id != 0 && !v.isDeleted).map(v => {
        
        v.item.lines = parseInt(v.item.lines.toString())
        const diff = diffObject(v.old_item, v.item, false);
        if(v.selected_contract?.label !== v.item.contract_id) diff.contract_id = v.selected_contract?.label 
        if(v.selected_tarrif?.label !== v.item.tarrif_id) diff.tarrif_id = v.selected_tarrif?.label
        return {id : v.item.id, item : diff}
    })
    const diffChatBot = chatBotComputed.value.filter(v => v.item.id != 0 && !v.isDeleted).map(v => {
        
        v.item.lines_count = parseInt(v.item.lines_count.toString())
        const diff = diffObject(v.old_item, v.item, false);
        if(v.selected_contract?.label !== v.item.contract_id) diff.contract_id = v.selected_contract?.label 
        if(v.selected_tarrif?.label !== v.item.tarrif_id) diff.tarrif_id = v.selected_tarrif?.label
        const messengers = toRaw(v.messengers.filter(v => v.active).map(m => m.item.name))
        if(isDiffArraySimple(messengers, v.item.messengers)) diff.messengers = messengers
        return {id : v.item.id, item : diff}
    })
    const diffAutoinfo = autoInfoComputed.value.filter(v => v.item.id != 0 && !v.isDeleted).map(v => {
        
        v.item.quantity = parseInt(v.item.quantity.toString())
        const diff = diffObject(v.old_item, v.item, false);
        if(v.selected_contract?.label !== v.item.contract_id) diff.contract_id = v.selected_contract?.label 
        if(v.selected_tarrif?.label !== v.item.tarrif_id) diff.tarrif_id = v.selected_tarrif?.label
        return {id : v.item.id, item : diff}
    })
    const diffWebForm = webFormsComputed.value.filter(v => v.item.id != 0 && !v.isDeleted).map(v => {
        
        const diff = diffObject(v.old_item, v.item, false);
        if(v.selected_contract?.label !== v.item.contract_id) diff.contract_id = v.selected_contract?.label 
        if(v.selected_tarrif?.label !== v.item.tarrif_id) diff.tarrif_id = v.selected_tarrif?.label
        const integrations = v.integrations.filter(i => i.active).map(i => i.item.name)
        if(isDiffArraySimple(integrations, v.item.integrations)) diff.integrations = integrations
        return {id : v.item.id, item : diff}
    })
    const vat2 = await Promise.all(await diffVats.filter(i => Object.keys(i.item).length !== 0).map(async v => {
        return await $axios.patchVats(v.id, v.item);
    }))
    const voiceRobot2 = await Promise.all(await diffVoiceRobot.filter(i => Object.keys(i.item).length !== 0).map(async v => {
        return await $axios.patcVoiceRobot(v.id, v.item);
    }))
    const chatBot2 = await Promise.all(await diffChatBot.filter(i => Object.keys(i.item).length !== 0).map(async v => {
        const data = {
            ...v.item,
            messengers : v.item.messengers?.map(m => {
                const a = billingStateStore.messengers.find(mm => mm.name === m)?.id
                return a
            }).filter(m => isDefined(m))
        }
        return await $axios.patcChatBots(v.id, data);
    }))

    const autoinfo2 = await Promise.all(await diffAutoinfo.filter(i => Object.keys(i.item).length !== 0).map(async v => {
        return await $axios.patcAutoInfo(v.id, v.item);
    }))
    const webForm2 = await Promise.all(diffWebForm.filter(i => Object.keys(i.item).length !== 0).map(async v => {
        const data = {
            ...v.item,
            integrations : v.item.integrations?.map(i => {
                const a = billingStateStore.integrations.find(ii => ii.name === i)?.id
                return a
            }).filter(i => isDefined(i))
        }
        return await $axios.patcWebform(v.id, data);
    }))

    await Promise.all(delVats.map(async d => {
        const data = await $axios.deleteVats(d);
        if(data) billingStateStore.vats.splice(billingStateStore.vats.findIndex(i => i.id === d), 1)
    }))

    await Promise.all(delVoiceRobot.map(async d => {
        const data = await $axios.deleteVoiceRobot(d);
        if(data) billingStateStore.voiceRobots.splice(billingStateStore.voiceRobots.findIndex(i => i.id === d), 1)
    }))

    await Promise.all(delChatBot.map(async d => {
        const data = await $axios.deleteChatBot(d);
        if(data) billingStateStore.chatBots.splice(billingStateStore.chatBots.findIndex(i => i.id === d), 1)
    }))

    await Promise.all(delAutoInfo.map(async d => {
        const data = await $axios.deleteAutoInfo(d);
        if(data) billingStateStore.autoinformations.splice(billingStateStore.autoinformations.findIndex(i => i.id === d), 1)
    }))

    await Promise.all(delWebForm.map(async d => {
        const data = await $axios.deleteWebform(d);
        if(data) billingStateStore.webform.splice(billingStateStore.webform.findIndex(i => i.id === d), 1)
    }))


    vat2.forEach(v => {
        let vv = billingStateStore.vats.findIndex(vvv => v.id === vvv.id)
        if(vv > -1){
            billingStateStore.vats[vv] = {...v}
        }
    })

    voiceRobot2.forEach(v => {
        let vv = billingStateStore.voiceRobots.findIndex(vvv => v.id === vvv.id)
        if(vv > -1){
            billingStateStore.voiceRobots[vv] = {...v}
        }
    })
    chatBot2.forEach(v => {
        let vv = billingStateStore.chatBots.findIndex(vvv => v.id === vvv.id)
        console.log(v)
        if(vv > -1){
            billingStateStore.chatBots[vv] = {...v}
        }
    })
    voiceRobot2.forEach(v => {
        let vv = billingStateStore.voiceRobots.findIndex(vvv => v.id === vvv.id)
        if(vv > -1){
            billingStateStore.voiceRobots[vv] = {...v}
        }
    })
    autoinfo2.forEach(v => {
        let vv = billingStateStore.autoinformations.findIndex(vvv => v.id === vvv.id)
        if(vv > -1){
            billingStateStore.autoinformations[vv] = {...v}
        }
    })
    webForm2.forEach(v => {
        let vv = billingStateStore.webform.findIndex(vvv => v.id === vvv.id)
        if(vv > -1){
            billingStateStore.webform[vv] = {...v}
        }
    })

    billingStateStore.vats.push(...vat.filter(b => isDefined(b)));
    billingStateStore.voiceRobots.push(...voiceRobot.filter(b => isDefined(b)));
    billingStateStore.chatBots.push(...chatBot.filter(b => isDefined(b)));
    billingStateStore.autoinformations.push(...autoinfo.filter(b => isDefined(b)));
    billingStateStore.webform.push(...webForm.filter(b => isDefined(b)));

    toastStore.openToast("Данные сохраненны")

    modalStore.hideModal();

}catch(e) {
    console.log(e)
    if((e as Error).message === "Validation Error") toastStore.openToast("Не все поля правильно заполнены или заполнены некорректно")
}
finally{
    menuStore.fetchDataLoad = false;
}
}



</script>
<template>
<div class="flex flex-col" >
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
            <div class="flex flex-col" v-if="openModulsMenu.vats">
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
            <div class="flex flex-col" v-if="openModulsMenu.voiceRobot">
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
            <div class="flex flex-col" v-if="openModulsMenu.chatBot">
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
            <div class="flex flex-col" v-if="openModulsMenu.autoinfo">
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
        <div class="flex flex-col" v-if="openModulsMenu.webForm">
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