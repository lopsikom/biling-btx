<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarDate } from '@internationalized/date'
import type { SelectorObject } from '~/services/models'
import type { IFieldMeta } from '~~/shared/models/APIModels'

// Рендерер динамического поля: описание из зеркала метаданных → инпут.
// model — сырое значение поля в values (как его понимает Bitrix).
const props = defineProps<{ field: IFieldMeta }>()
const model = defineModel<unknown>()

// enumeration: в values лежит id варианта, Selector работает с SelectorObject
const enumItems = computed(() => (props.field.items ?? []).map(i => ({ label: i.id, value: i.value } as SelectorObject)))
const enumValue = computed<SelectorObject | undefined>({
  get: () => enumItems.value.find(i => String(i.label) === String(model.value ?? '')),
  set: (v) => { model.value = v ? Number(v.label) : undefined }
})

// date/datetime: в values — ISO-строка, DateRangePicker работает с CalendarDate
const dateValue = computed<CalendarDate | undefined>({
  get: () => {
    if (!model.value) return undefined
    const d = new Date(String(model.value))
    if (Number.isNaN(d.getTime())) return undefined
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
  },
  set: (v) => {
    model.value = v ? `${v.year}-${String(v.month).padStart(2, '0')}-${String(v.day).padStart(2, '0')}T00:00:00.000Z` : undefined
  }
})

const textValue = computed<string | number | null | undefined>({
  get: () => model.value as string | number | null | undefined,
  set: (v) => { model.value = v }
})

const boolValue = computed<boolean>({
  get: () => model.value === true || model.value === 'Y' || model.value === '1' || model.value === 1,
  set: (v) => { model.value = v }
})

const isNumber = computed(() => ['integer', 'double', 'money'].includes(props.field.type))
const isDate = computed(() => ['date', 'datetime'].includes(props.field.type))
</script>

<template>
  <Selector
    v-if="field.type === 'enumeration'"
    v-model="enumValue"
    :title="field.title"
    :required="field.isRequired"
    :items="enumItems"
    style="width: 100%;"
  />
  <DateRangePicker
    v-else-if="isDate"
    v-model="dateValue"
    :title="field.title"
    :required="field.isRequired"
  />
  <div
    v-else-if="field.type === 'boolean'"
    class="flex items-center gap-3"
    style="padding-top: 24px;"
  >
    <CheckboxRoot
      v-model="boolValue"
      :class="boolValue ? 'checkbox-active' : 'checkbox-disable'"
    >
      <CheckboxIndicator>
        <Icon
          icon="radix-icons:check"
          style="color: white;"
        />
      </CheckboxIndicator>
    </CheckboxRoot>
    <span class="select-none font-semibold text-sm">{{ field.title }}</span>
  </div>
  <InputBox
    v-else
    v-model="textValue"
    :placeholder="'Введите значение...'"
    :type="isNumber ? 'number' : 'text'"
    :resize="false"
    :title="field.title"
    :required="field.isRequired"
    style="width: 100%;"
  />
</template>

<style scoped>
.checkbox-disable{
    background-color: #edf2f7;
    border-color: #e7eaee;
    border-width: 1.0px;
    border-radius: 5px;
    display: flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
}
.checkbox-active{
    background-color: #3182ce;
    border-color: #e7eaee;
    border-width: 1.0px;
    border-radius: 5px;
    display: flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
}
</style>
