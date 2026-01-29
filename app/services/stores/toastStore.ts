const useToastStore = defineStore('toast',() => {

    const open = ref(false)
    const title = ref<string>("");

    const timeOut = ref(0);

    function openToast(text : string){
        open.value = false;
        window.clearTimeout(timeOut.value);
        timeOut.value = window.setTimeout(()=> {
            title.value = text;
            open.value = true;
        }, 100)
    }


    return {
        open,
        title,
        timeOut,
        openToast
    }
})

export default useToastStore