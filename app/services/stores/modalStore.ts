import { ModalEnum } from "../models/enums/billing/ModalsEnum";

const useModalStore = defineStore('modal', () => {
        const openModal = ref(false);
        const modalID = ref<ModalEnum | null>();

        function showModal(id : ModalEnum){
            modalID.value = id;
            openModal.value = true;
        }
        function hideModal(){
            openModal.value = false;
            modalID.value = null;
        }
        return {
            openModal,
            modalID,
            showModal,
            hideModal
        }
})

export default useModalStore;