import {  type IVoiceRobot,  type IVats,   type IContract,  type IChatBot, type IAutoinformation, type IWebform, type IMessengers, type Integrations, type ITarrifs, type IContractStatus, type IContractDocType, type IContractProlongation, type IContractOriginalType, type IConnection, type IConnectionStatus, type IConnectionType, type IUser } from "~~/shared/models/APIModels";
import type { IContact } from "../models";

const usebillingStateStore = defineStore("billingState", () => {
    const contracts = ref<IContract[]>([]);
    const contractsTariff = ref<IContract[]>([]);
    const vats = ref<IVats[]>([]);
    const voiceRobots = ref<IVoiceRobot[]>([]);
    const chatBots = ref<IChatBot[]>([]);
    const autoinformations = ref<IAutoinformation[]>([]);
    const webform = ref<IWebform[]>([]);
    const messengers = ref<IMessengers[]>([]);
    const integrations = ref<Integrations[]>([]);
    const tariff = ref<ITarrifs[]>([]);
    const contractStatuses = ref<IContractStatus[]>([]);
    const contractDocTypes = ref<IContractDocType[]>([]);
    const contractProlongations = ref<IContractProlongation[]>([]);
    const contractOriginalTypes = ref<IContractOriginalType[]>([]);
    const connections = ref<IConnection[]>([]);
    const connection_statuses = ref<IConnectionStatus[]>([]);
    const connection_types = ref<IConnectionType[]>([]);
    const companyUsers = ref<IUser[]>([]);

    const isRefreshContracts = ref<boolean>(false);

    return {
        contracts,
        vats,
        isRefreshContracts,
        voiceRobots,
        chatBots,
        autoinformations,
        contractsTariff,
        webform,
        messengers,
        integrations,
        tariff,
        contractStatuses,
        contractDocTypes,
        contractProlongations,
        contractOriginalTypes,
        connections,
        connection_statuses,
        connection_types,
        companyUsers
    }
})

export default usebillingStateStore