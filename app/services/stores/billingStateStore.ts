import {  type IVoiceRobot,  type IVats,   type IContract,  type IChatBot, type IAutoinformation, type IWebform, type IMessengers, type Integrations, type ITarrifs, type IContractStatus } from "~~/shared/models/APIModels";

const usebillingStateStore = defineStore("billingState", () => {
    const contracts = ref<IContract[]>([]);
    const vats = ref<IVats[]>([]);
    const voiceRobots = ref<IVoiceRobot[]>([]);
    const chatBots = ref<IChatBot[]>([]);
    const autoinformations = ref<IAutoinformation[]>([]);
    const webform = ref<IWebform[]>([]);
    const messengers = ref<IMessengers[]>([]);
    const integrations = ref<Integrations[]>([]);
    const tariff = ref<ITarrifs[]>([]);
    const contractStatuses = ref<IContractStatus[]>([])

    return {
        contracts,
        vats,
        voiceRobots,
        chatBots,
        autoinformations,
        webform,
        messengers,
        integrations,
        tariff,
        contractStatuses
    }
})

export default usebillingStateStore