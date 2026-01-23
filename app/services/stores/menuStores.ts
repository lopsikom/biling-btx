import { defineStore } from "pinia";

const useMenuStore = defineStore('menu', () => {

    const openEditSelector = reactive({
        companyInfo : false,
        usersInfo : false
    })
    const openEditMode = reactive({
        companyInfo : false,
        userInfo : false
    })

    const fetchDataLoad = ref<boolean>(true)
    
    function closeAllMenu(){
        const keys = Object.keys(openEditSelector)
        keys.forEach(k =>{
            openEditSelector[k as keyof typeof openEditSelector] = false;
        })
    }

    return{
        openEditMode,
        openEditSelector,
        fetchDataLoad,
        closeAllMenu
    }

})

export default useMenuStore