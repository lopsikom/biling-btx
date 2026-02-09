<script setup lang="ts">
import { Icon } from '@iconify/vue';


const badInstall = ref(false)
const errorTitle = ref()

onMounted( async () => {
    try{
        const url = useRuntimeConfig().public.BaseUri + useRuntimeConfig().public.BaseUrl;
        const {$initializeB24Frame, $axios} = useNuxtApp();
        const frame = await $initializeB24Frame();
        const data = frame.auth.getAuthData()
        if(!data) {badInstall.value = true; return}
        const verify = await $axios.verifyBitrixUser(data.access_token);
        debugger
        if(!verify) {badInstall.value = true; return}
        try{
            await frame.callMethod('placement.bind',{
            PLACEMENT : "CRM_COMPANY_DETAIL_TAB",
            HANDLER : url,
            DESCRIPTION : "DESCRIPTION",
            LANG_ALL : {
                en : {
                    TITLE : "Billing",
                    DESCRIPTION : "DESCRIPTION"
                },
                ru : {
                    TITLE : "Billing",
                    DESCRIPTION : "Описание"
                }
            }        
        })
        }
        catch(e){
            console.error(e)
            errorTitle.value = e;
        }
        frame.installFinish();
    }catch(e){
        console.error(e);
        badInstall.value = true;
        errorTitle.value = e;
    }
    
})

</script>
<template>
    <div class="flex flex-col justify-center items-center" style="height: 100vh;">
        <Icon icon="line-md:loading-loop" width="120" v-if="!badInstall"/>
        <div v-else>
            <p>Ошибка установки приложения</p>
            <p>{{ errorTitle }}</p>
        </div>
    </div>
</template>