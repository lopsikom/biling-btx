<script setup lang="ts">
const model = defineModel<string>()
const props = defineProps<{
    title? : string
    default? : string | null
}>()

</script>
<template>
<div class="input-container">
    <p style="font-size: 0.9em; margin-left: 5px;">{{ title }}</p>
    <input class="input" v-text="default" v-model="model" :placeholder="`${title}...`"/>
</div>
</template>
<style scoped>
.input-container{
    display: flex;
    flex-direction: column;
    height: 100px;
    width: fit-content;
    height: fit-content;
    gap: 5px;
}
.input{
    width: 250px;
    height: 40px;
    padding: 5px;
    font-size: 1em;
    border: 1px solid rgba(0,0,0, 0.2);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
    border-radius: 10px;
}
</style>