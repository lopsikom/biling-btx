import type { IConnection, IContract, IContractUpdate } from "~~/shared/models/APIModels";
import { ModalEnum } from "../models/enums/billing/ModalsEnum";
import type { SelectorObject } from "../models";

const useModalStore = defineStore('modal', () => {
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

        function showModal(id : ModalEnum){
            modalID.value = id;
            openModal.value = true;
        }
        function showHigherModal(id : ModalEnum){
            modalHigherID.value = id;
            openModalHigher.value = true;
        }

        function hideModal(){
            
            if(openModalHigher.value){
                
                openModalHigher.value = false;
                modalHigherID.value = null;
            }
            else{
                
                openModal.value = false;
                modalID.value = null;
            }
        }
        return {
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
        }
})

export default useModalStore;