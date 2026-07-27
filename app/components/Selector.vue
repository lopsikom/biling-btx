<script setup lang="ts" generic="T extends string | number | SelectorObject | undefined">
import { Icon } from '@iconify/vue';
import { isObject } from '@vueuse/core';
import type { SelectorObject } from '~/services/models';
const props = withDefaults(defineProps<{
    items : T[],
    title? : string,
    width? : number,
    required? : boolean
}>(),{
    required : false
})

const model = defineModel<T>()
const error = defineModel<boolean>('error', { default: false })

const touched = ref(false)

const isEmpty = computed(() => {
    const v = model.value
    return v === null || v === undefined || String(v).trim() === ''
})

const hasError = computed(() => error.value || (props.required && touched.value && isEmpty.value))

// Текст выбранного значения — из модели напрямую. reka-ui SelectValue сам показывает
// текст только после того, как дропдаун открывали (SelectItemText зарегистрировался),
// поэтому пред-выбранное значение (режим редактирования) иначе выглядит пустым.
const displayText = computed(() => {
  const v = model.value
  if (v === null || v === undefined || v === '') return ''
  return isObject(v) && (v as SelectorObject).value ? String((v as SelectorObject).value) : String(v)
})
</script>
<template>
<div class="flex flex-col gap-[5px]">
    <span class="select-none font-semibold text-sm" v-if="title">{{ title }}</span>
    <SelectRoot v-model="model">
    <SelectTrigger class="select-menu text-sm gap-[10px]" :class="{ 'select-menu-error': hasError }" :style="width ? `width:${width}px`:''" @focusout="touched = true; error = false">
        <SelectValue style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 80%; text-align: start;">{{ displayText }}</SelectValue>
        <Icon icon="radix-icons:chevron-down" style="margin-left: auto;"/>
    </SelectTrigger>
    <SelectPortal >
        <SelectContent  :side-offset="2" class="p-[5px]" style="background:  white;  z-index: 999; border-color: #e7eaee;  border-width: 1.5px; border-radius: 10px;" position="popper">
        <SelectViewport style="max-height: 200px; overflow-y: auto; scrollbar-width: thin;">
            <SelectItem v-for="(value, index) in items" :key="index"  :value="value!" class="select-item" v-if="items">
                <SelectItemText class="select-title">{{ isObject(value) && value.value ? value.value : value }}</SelectItemText>
                <SelectItemIndicator style="margin-left: auto; ">
                    <Icon icon="radix-icons:check" class="text-gray-600"/>
                </SelectItemIndicator>
            </SelectItem>
        </SelectViewport>
    </SelectContent>
    </SelectPortal>
</SelectRoot>
</div>
</template>
<style scoped>
.select-menu{
    display: inline-flex;
    align-items: center;
    padding: 5px 15px;
    background-color: #edf2f7;
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 0, 0);
    height: 40px;
}

.select-menu:focus{
    outline: none;
}

.select-menu-error{
    background-color: #fff0f0;
    border-color: #e53e3e;
    transition: border-color 0.15s ease;
}

.select-content{
    overflow: hidden;
    background: white;
    border-radius: 6px;

}
.select-item{
    font-size: 13px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    height: 30px;
    min-width: 190px;
    padding: 0 10px 0 10px;
    position: relative;
    user-select: none;
}
.select-item[data-highlighted]{
    outline: none;
    background-color: #ebf8ff;
    transition: background-color 0.05s ease;
}
.select-item[data-highlighted] .select-title{
    color: #437db4;
    transition: color 0.05s ease;
}
</style>