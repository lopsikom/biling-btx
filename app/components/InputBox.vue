<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const model = defineModel<string | number | null | undefined>()
const error = defineModel<boolean>('error', { default: false })
defineOptions({
  inheritAttrs: false
})
const attrs = useAttrs() as HTMLAttributes


const wrapperAttrs = computed(() => ({
  class: attrs.class,
  style: attrs.style
}))

const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})
const props = withDefaults(defineProps<{
    rows? : number,
    placeholder? : string,
    title? : string,
    resize? : boolean,
    type? : "text" | "number",
    step? : number,
    required? : boolean,
    disabled? : boolean
}>(), {
    title : undefined,
    rows : 1,
    placeholder : '',
    resize : true,
    type : "text",
    step : 1,
    required : false,
    disabled : false
})

const touched = ref(false)

const isEmpty = computed(() => {
    const v = model.value
    return v === null || v === undefined || String(v).trim() === ''
})

const hasError = computed(() => error.value || (props.required && touched.value && isEmpty.value))

</script>
<template>
    <div class="flex flex-col gap-[5px]" v-bind="wrapperAttrs">
        <span class="select-none font-semibold text-sm" v-if="title">{{ title }}</span>
        <textarea v-if="resize" v-bind="inputAttrs" :type="type" :step="step" v-model="model" :rows="rows" :placeholder="placeholder" :disabled="disabled" class="edit-input" :class="{ 'input-error': hasError }" @blur="touched = true; error = false"/>
        <input v-else :type="type" :step="step" v-bind="inputAttrs" v-model="model" :placeholder="placeholder" :disabled="disabled" class="edit-input" :class="{ 'input-error': hasError }" @blur="touched = true; error = false"/>
    </div>
</template>
<style scoped>
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
.edit-input{
    padding: 7px 10px;
    background-color: #edf2f7;
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 0, 0);
    width: 100%;
    resize: none;
}
.edit-input:focus{
    border-color: #9bc6e8b1;
    box-shadow: 0 0 8px rgba(158, 203, 238);
    outline: none;
    transition: border-color 0.15s ease;
    transition: box-shadow 0.15s ease;
}
.edit-input.input-error{
  background-color: #fff0f0;
    border-color: #e53e3e;
    transition: border-color 0.15s ease;
}
.edit-input.input-error:focus{
    border-color: #e53e3e;
    box-shadow: 0 0 8px rgba(229, 62, 62, 0.5);
}
.edit-input:disabled{
    opacity: 0.6;
    cursor: not-allowed;
}
</style>