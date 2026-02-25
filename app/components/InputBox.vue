<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const model = defineModel<string | number | null | undefined>()
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
    type? : "text" | "number"
}>(), {
    title : undefined,
    rows : 1,
    placeholder : '',
    resize : true,
    type : "text"
})

</script>
<template>
    <div class="flex flex-col gap-[5px]" v-bind="wrapperAttrs">
        <span class="select-none font-semibold text-sm" v-if="title">{{ title }}</span>
        <textarea v-if="resize" v-bind="inputAttrs":type="type" v-model="model" :rows="rows" :placeholder="placeholder" class="edit-input"/>
        <input v-else :type="type" v-bind="inputAttrs" v-model="model" :placeholder="placeholder" class="edit-input"/>
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
</style>