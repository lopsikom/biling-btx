<script setup lang="ts">
import useConfirmStore from '~/services/stores/confirmStore'

const confirm = useConfirmStore()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="confirm.visible"
      class="confirm-overlay"
      @click.self="confirm.cancel()"
    >
      <div class="confirm-card flex flex-col gap-3">
        <span class="font-semibold text-lg select-none">{{ confirm.title }}</span>
        <span class="text-gray-600 text-sm">{{ confirm.message }}</span>
        <div
          class="flex gap-3 mt-2"
          style="margin-left: auto;"
        >
          <div
            class="cancel-btn px-4 py-2 select-none"
            @click="confirm.cancel()"
          >
            Отмена
          </div>
          <div
            class="danger-btn px-4 py-2 select-none"
            @click="confirm.confirm()"
          >
            {{ confirm.confirmText }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirm-overlay{
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99999999999999999999;
    pointer-events: auto;
}
.confirm-card{
    background: white;
    border-radius: 12px;
    padding: 24px;
    width: 420px;
    max-width: 90vw;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.cancel-btn{
    border: 1.5px solid #e7eaee;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
}
.cancel-btn:hover{ background: #f1f5f9; }
.danger-btn{
    background: #dc2626;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: white;
}
.danger-btn:hover{ background: #ef4444; }
</style>
