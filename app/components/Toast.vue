<script setup lang="ts">
import { Icon } from '@iconify/vue';
import useToastStore from '~/services/stores/toastStore';


const toastStore = useToastStore();

const {title, open, kind} = storeToRefs(toastStore);
</script>
<template>
    <ToastProvider>
        <ToastRoot v-model:open="open" class="ToastRoot" :class="`ToastRoot--${kind}`">
            <VisuallyHidden>
                <ToastDescription></ToastDescription>
            </VisuallyHidden>
            <ToastTitle class="ToastTitle">
                <div class="flex gap-[10px] items-center">
                    <Icon :icon="kind === 'error' ? 'icon-park-solid:attention' : 'icon-park-solid:check-one'"
                          class="w-5 h-5"
                          :class="kind === 'error' ? 'text-red-600' : 'text-green-600'"/>
                    <span >{{ title }}</span>
                </div>
            </ToastTitle>
            <ToastAction class="ToastAction" alt-text="undo">
                <button class="button text-xs  text-gray-50">Убрать</button>
            </ToastAction>
        </ToastRoot>
        <ToastViewport class="ToastViewport" />
    </ToastProvider>
</template>
<style>
@import '~/assets/css/any-container.css';

    .ToastViewport {
  --viewport-padding: 25px;
  position: fixed;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: var(--viewport-padding);
  gap: 10px;
  min-width: 390px;
  width: fit-content;
  max-width: 100vw;
  margin: 0;
  list-style: none;
  z-index: 2147483647;
  outline: none;
}

.ToastRoot {
  background-color: white;
  border-radius: 6px;
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
  padding: 15px;
  display: grid;
  min-width: 350px;
  width: fit-content;
  grid-template-areas: 'title action' 'description action';
  grid-template-columns: auto max-content;
  column-gap: 15px;
  align-items: center;
}
/* Полоса слева — чтобы род сообщения читался мгновенно, до чтения текста */
.ToastRoot--success {
  border-left: 4px solid #16a34a;
}
.ToastRoot--error {
  border-left: 4px solid #dc2626;
}
.ToastRoot[data-state='open'] {
  animation: slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.ToastRoot[data-state='closed'] {
  animation: hide 100ms ease-in;
}
.ToastRoot[data-swipe='move'] {
  transform: translateX(var(--reka-toast-swipe-move-x));
}
.ToastRoot[data-swipe='cancel'] {
  transform: translateX(0);
  transition: transform 200ms ease-out;
}
.ToastRoot[data-swipe='end'] {
  animation: swipeOut 100ms ease-out;
}

@keyframes hide {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(calc(100% + var(--viewport-padding)));
  }
  to {
    transform: translateX(0);
  }
}

@keyframes swipeOut {
  from {
    transform: translateX(var(--reka-toast-swipe-end-x));
  }
  to {
    transform: translateX(calc(100% + var(--viewport-padding)));
  }
}

.ToastTitle {
  grid-area: title;
  display: flex;
  margin-bottom: 5px;
  font-weight: 500;
  width: fit-content;
  color: var(--slate-12);
  font-size: 15px;
}

.ToastDescription {
  grid-area: description;
  margin: 0;
  color: var(--slate-11);
  font-size: 13px;
  line-height: 1.3;
}

.ToastAction {
  grid-area: action;
}
.button{
    background-color: rgb(22, 22, 22);
    padding: 5px 8px;
    border-radius: 5px;
}

.button:hover{
    background: rgba(22, 22, 22, 0.95);
}

</style>