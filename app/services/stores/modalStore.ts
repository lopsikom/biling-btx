import type { IConnection, IContract, IContractUpdate } from "~~/shared/models/APIModels";
import { ModalEnum, ModuleEnum } from "../models/enums/billing/ModalsEnum";
import type { SelectorObject } from "../models";

const useModalStore = defineStore('modal', () => {
        const argsModal = ref<Record<string, unknown>>({})
        const openModal = ref(false);
        const modalID = ref<ModalEnum | null>();
        const openModalHigher = ref(false);
        const modalHigherID = ref<ModalEnum | null>();
        const EditContract = ref<IContract | null>(null);
        const EditConnection = ref<IConnection | null>(null);
        const addContractTariff = ref<{item : any, selected_contract : {
    label: number;
    value: string;
} | undefined} | null>(null);

        function showModal(id : ModalEnum, ...args : {key : string, data : unknown}[]){
            args.forEach(a => argsModal.value[a.key] = a.data)
            modalID.value = id;
            openModal.value = true;
        }
        function showHigherModal(id : ModalEnum){
            modalHigherID.value = id;
            openModalHigher.value = true;
        }

        function hideModal(){
            argsModal.value = {}
            if(openModalHigher.value){
                
                openModalHigher.value = false;
                modalHigherID.value = null;
            }
            else{
                
                openModal.value = false;
                modalID.value = null;
            }
        }
        function findModalArg(): { key: string; value: unknown } | undefined { //Поменять логику поиска
            const moduleValues = Object.values(ModuleEnum) as string[];
            
            const foundKey = Object.keys(argsModal.value).find((key) =>
                moduleValues.includes(key)
            );

            if (!foundKey) return undefined;

            return {
                key: foundKey as ModuleEnum,
                value: argsModal.value[foundKey],
            };
            }
        return {
            argsModal,
            openModal,
            modalID,
            openModalHigher,
            modalHigherID,
            EditContract,
            addContractTariff,
            EditConnection,
            showModal,
            hideModal,
            showHigherModal,
            findModalArg
        }
})

export default useModalStore;