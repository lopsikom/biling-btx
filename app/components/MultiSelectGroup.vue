<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { IFieldMeta } from '~~/shared/models/APIModels'

// Мультиселект-группа (field group): несколько flag/boolean-полей как один селектор.
// Дизайн — выпадашка с чекбоксами + теги выбранных (как старая модалка мессенджеров).
// v-model — общий объект values формы (ключи = коды полей); правим только поля группы.
const props = withDefaults(defineProps<{ title: string, fields: IFieldMeta[], disabled?: boolean }>(), { disabled: false })
const values = defineModel<Record<string, unknown>>({ required: true })

const open = ref(false)

// Поле включено, если значение = Y/true/1 или = id варианта «Да» (trueEnumId)
function isOn(field: IFieldMeta): boolean {
  const v = values.value[field.code]
  if (v === true || v === 'Y' || v === 1 || v === '1') return true
  return !!field.trueEnumId && String(v) === field.trueEnumId
}
function toggle(field: IFieldMeta) {
  if (props.disabled) return
  values.value = { ...values.value, [field.code]: isOn(field) ? 'N' : 'Y' }
}
function toggleOpen() {
  if (props.disabled) return
  open.value = !open.value
}

const selected = computed(() => props.fields.filter(isOn))

// Закрытие по клику вне
const root = ref<HTMLElement>()
function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div
    ref="root"
    class="flex flex-col gap-[5px]"
    style="position: relative;"
  >
    <span class="select-none font-semibold text-sm">{{ title }}</span>
    <div
      class="msg-trigger blue-hover flex items-center px-[10px]"
      :class="{ 'msg-trigger-disabled': disabled }"
      @click="toggleOpen()"
    >
      <span
        class="select-none text-sm"
        style="white-space: nowrap; width: 85%; text-overflow: ellipsis; overflow: hidden;"
        :class="selected.length ? '' : 'text-gray-400'"
      >
        {{ selected.length ? selected.map(f => f.title).join(', ') : 'Выберите значение' }}
      </span>
      <Icon
        icon="radix-icons:chevron-down"
        style="margin-left: auto;"
      />
    </div>

    <div
      v-if="open"
      class="msg-dropdown"
    >
      <div class="msg-panel">
        <div
          v-for="field in fields"
          :key="field.code"
          class="flex items-center px-[8px] py-[6px] gap-[8px] cursor-pointer msg-option"
          @click="toggle(field)"
        >
          <CheckboxRoot
            :model-value="isOn(field)"
            :disabled="disabled"
            :class="isOn(field) ? 'checkbox-active' : 'checkbox-disable'"
            @click.stop="toggle(field)"
          >
            <CheckboxIndicator>
              <Icon
                icon="radix-icons:check"
                style="color: white;"
              />
            </CheckboxIndicator>
          </CheckboxRoot>
          <span class="text-sm select-none">{{ field.title }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="selected.length"
      class="tags-container mt-[2px]"
    >
      <div
        v-for="field in selected"
        :key="field.code"
        class="tag-box"
      >
        <span
          style="font-size: 0.7em;"
          class="cursor-default font-semibold"
        >{{ field.title }}</span>
        <Icon
          v-if="!disabled"
          icon="maki:cross"
          class="w-2.5 h-2.5 hover-red cursor-pointer"
          @click="toggle(field)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-trigger{
    height: 38px;
    border: 1.5px solid #e7eaee;
    border-radius: 5px;
    cursor: pointer;
    background: white;
}
.msg-trigger-disabled{
    opacity: 0.6;
    cursor: not-allowed;
}
.blue-hover:hover{ background-color: #ebf8ff; transition: background-color 0.15s ease; }
.msg-dropdown{
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 9999;
    width: 100%;
    margin-top: 4px;
}
.msg-panel{
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: white;
    border-radius: 10px;
    padding: 4px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.msg-option:hover{ background: #ebf8ff; border-radius: 6px; }
.tags-container{ display: flex; flex-wrap: wrap; gap: 8px; }
.tag-box{
    padding: 3px 8px;
    display: flex;
    height: fit-content;
    align-items: center;
    gap: 5px;
    border-radius: 6px;
    background: #edf2f7;
    border: 1.5px solid #eaeff5;
}
.hover-red:hover{ color: red; }
.checkbox-disable{ background-color: #edf2f7; border: 1px solid #e7eaee; border-radius: 5px; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; }
.checkbox-active{ background-color: #3182ce; border: 1px solid #e7eaee; border-radius: 5px; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; }
</style>
