<script setup lang="ts">
import { defaultWindow } from '@vueuse/core';
import useErrorStateStore from '~/services/stores/errorStateStore';
const isDev= ref(useNuxtApp().$config.public.dev);
const error = useErrorStateStore()
</script>
<template>
  <Teleport to="body">
    <div v-if="error.visibleError" class="overlay">
      <div class="flex flex-col absolute left-0 top-0 p-20 gap-2">
        <h2 class="text-gray-50 text-5xl font-semibold pb-5" style="border-bottom: 1px solid white;">{{ error.titleError }}</h2>
        <p class="text-gray-50 ">{{ error.messageError }}</p>
        <button class="fixed right-0 bottom-0 text-gray-100 mr-10 mb-10 text-2xl" @click="() => {defaultWindow?.parent.location.reload()}">Перезагрузить</button>
        <button class="fixed right-0 bottom-0 text-red-600 mr-60 mb-10 text-2xl" @click="error.closeError()" v-if="isDev">Закрыть</button>
      </div>
    </div>
  </Teleport>
</template>


<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999999999999999999;
}

</style>
