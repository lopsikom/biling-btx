<script setup lang="ts">
import MoreIcon from '@bitrix24/b24icons-vue/actions/MoreIcon'
</script>
<template>
    <div class="more-box">
        <MoreIcon class="w-5 h-5 more-hover" style="rotate: 90deg;" />
    </div>
</template>
<style>
.more-box{
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;
    width: 36px;
    border-radius: 6px;
}
.more-box:hover {
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.more-box:hover .more-hover{
    color: #437db4;
    transition: color 0.15s ease;
}
</style>