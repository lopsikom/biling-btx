import useModalStore from "./modalStore";

const useErrorStateStore = defineStore('error', () =>{
    const visibleError = ref(false);
    const titleError = ref<string>('');
    const messageError = ref<string>('');
    const rawError = ref<any>(null);
    const modalStore = useModalStore();
    function showError(error : any, title = 'Error'){
        titleError.value = title;
        messageError.value = error?.message || error?.data?.message || 'Возникла ошибка';
        rawError.value = error;
        visibleError.value = true;
    }
    function closeError(){
        modalStore.hideModal()
        visibleError.value = false;
        rawError.value = null;
    }

    return {
        visibleError,
        titleError,
        messageError,
        rawError,
        showError,
        closeError
    }
})

export default useErrorStateStore;