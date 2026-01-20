<script setup lang="ts">
const model = defineModel<string>()
const props = withDefaults(defineProps<{
    rows? : number,
    placeholder? : string,
}>(), {
    rows : 1,
    placeholder : ''
})

</script>
<template>
    <textarea type="text" v-model="model" :rows="rows" :placeholder="placeholder" class="edit-input"/>
</template>
<style scoped>
.edit-input{
    padding: 7px 10px;
    background-color: #edf2f7;
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 0, 0);
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