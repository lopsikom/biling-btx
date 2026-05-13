<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Bitrix24Event } from '~/services/models';
import { unbindAllEvent, unbindAllPlacement } from '~/services/utils/utils';


const badInstall = ref(false)
const errorTitle = ref()
const dev = useRuntimeConfig().public.dev

onMounted( async () => {
    try{
        const url = useRuntimeConfig().public.BaseUri + useRuntimeConfig().public.BaseUrl;
        const {$initializeB24Frame, $axios} = useNuxtApp();
        const frame = await $initializeB24Frame();
        const data = frame.auth.getAuthData()
        if(!data) {badInstall.value = true; return}
        const verify = await $axios.verifyBitrixUser(data.access_token);
        if(!verify) {badInstall.value = true; return}
        try{
            await unbindAllEvent(frame)
            const eventsKeys = Object.values(Bitrix24Event);
            await Promise.all(eventsKeys.map(async e => {
                try{
                    await frame.callMethod("event.bind", {
                    event : e,
                    handler : `${url}api/bitrix/webhook`
                    })
                }catch(e){
                    console.error(e)
                }
            }))
            await unbindAllPlacement(frame)
            await frame.callMethod('placement.bind',{
                PLACEMENT : "CRM_COMPANY_DETAIL_TAB",
                HANDLER : url,
                DESCRIPTION : "DESCRIPTION",
                LANG_ALL : {
                    en : {
                        TITLE : dev ? "Billing-dev" : "Billing",
                        DESCRIPTION : "DESCRIPTION"
                    },
                    ru : {
                        TITLE : dev ? "Биллинг-dev" : "Биллинг",
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