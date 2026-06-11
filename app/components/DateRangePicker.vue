<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import {
  DatePickerArrow,
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
  Label,
} from 'reka-ui'
import type { CalendarDate } from '@internationalized/date';

const model = defineModel<CalendarDate>()
const props = defineProps<{
    title? : string
}>()

const open = ref(false)

watch(model, (newVal) => {
  if (newVal) {
    open.value = false
  }
})
</script>

<template>
  <div class="df-wrapper">
    <Label for="date-field" class="df-label" v-if="title">{{ title }}</Label>

    <DatePickerRoot id="date-field" granularity="day" locale="ru" v-model="model" v-model:open="open">
      <DatePickerField v-slot="{ segments }" class="df-field">
        <!-- Отображаем сегменты как интерактивные поля (literal / segment) -->
        <template v-for="seg in segments">
          <DatePickerInput
            v-if="seg.part === 'literal'"
            :part="seg.part"
            class="df-literal"
          >
            {{ seg.value }}
          </DatePickerInput>

          <DatePickerInput
            v-else
            :part="seg.part"
            class="df-segment"
          >
            {{ seg.value }}
          </DatePickerInput>
        </template>
        <DatePickerTrigger class="df-trigger" aria-label="Открыть календарь">
          <Icon icon="radix-icons:calendar" class="df-icon" />
        </DatePickerTrigger>
      </DatePickerField>

      <DatePickerContent align="center" :side-offset="12" class="df-popover">
        <DatePickerArrow class="df-popover-arrow" />
        <DatePickerCalendar v-slot="{ weekDays, grid }" class="df-calendar">
          <DatePickerHeader class="df-cal-header">
            <DatePickerPrev class="df-nav-btn" aria-label="Предыдущий месяц">
              <Icon icon="radix-icons:chevron-left" class="text-black-900" />
            </DatePickerPrev>

            <DatePickerHeading class="df-cal-heading" />

            <DatePickerNext class="df-nav-btn" aria-label="Следующий месяц">
              <Icon icon="radix-icons:chevron-right" class="text-black-900" />
            </DatePickerNext>
          </DatePickerHeader>

          <div class="df-cal-wrapper">
            <DatePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="df-grid"
            >
              <DatePickerGridHead>
                <DatePickerGridRow class="df-grid-row">
                  <DatePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="df-grid-headcell"
                  >
                    {{ day }}
                  </DatePickerHeadCell>
                </DatePickerGridRow>
              </DatePickerGridHead>

              <DatePickerGridBody>
                <DatePickerGridRow
                  v-for="(weekDates, idx) in month.rows"
                  :key="`w-${idx}`"
                  class="df-grid-row"
                >
                  <DatePickerCell
                    v-for="wd in weekDates"
                    :key="wd.toString()"
                    :date="wd"
                    class="df-cell"
                  >
                    <DatePickerCellTrigger
                      :day="wd"
                      :month="month.value"
                      class="df-cell-trigger"
                    />
                  </DatePickerCell>
                </DatePickerGridRow>
              </DatePickerGridBody>
            </DatePickerGrid>
          </div>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>
  </div>
</template>
<style>

.df-wrapper {
  display: inline-block;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}


.df-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 13px;
}


.df-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #edf2f7;
  border: 1px solid #e6edf3;
  padding: 10px 12px;
  border-radius: 10px;
  min-width: 200px;
  box-shadow: none;
}


.df-segment,
.df-literal {
  font-size: 14px;
  color: #0f172a;
  line-height: 1;
}

.df-segment input,
.df-literal input {
  border: none !important;
  background: transparent !important;
  outline: none !important;
}

.df-segment:focus,
.df-segment[data-focused] {
  outline: none;
  box-shadow: none;
  background: rgba(43, 153, 255, 0.08);
  border-radius: 4px;
}

.df-trigger {
  margin-left: auto;
  background: #3f8fd5;
  border-radius: 8px;
  padding: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 0 rgba(16,24,40,0.03);
}


.df-icon {
  width: 16px;
  height: 16px;
  color: white;
}

.df-popover {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(16,24,40,0.12);
  padding: 12px;
  width: 320px;
  z-index: 999;
}

.df-popover-arrow {
  filter: drop-shadow(0 1px 0 rgba(16,24,40,0.04));
}

.df-cal-header {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.df-cal-heading {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
  text-align:center;
  flex: 1;
}

.df-nav-btn {
  background: transparent;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  display:flex;
  align-items:center;
}

.df-cal-wrapper {
  display:flex;
  gap: 12px;
  overflow:auto;
}

.df-grid {
  min-width: 280px;
}

.df-grid-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.df-grid-headcell {
  text-align: center;
  font-size: 12px;
  color: #667085;
  padding-bottom: 6px;
}

.df-cell {
  display:flex;
}
.df-cell-trigger {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size: 13px;
  cursor:pointer;
  color: #0f172a;
  background: transparent;
  border: 1px solid transparent;
}

.df-cell-trigger:hover {
  background: rgba(43,153,255,0.08);
  border-color: rgba(43,153,255,0.12);
}
.df-cell-trigger[aria-selected="true"] {
  background: #2b99ff;
  color: white;
  box-shadow: 0 6px 18px rgba(43,153,255,0.16);
  border-color: transparent;
}

.df-cell-trigger[aria-disabled="true"] {
  color: #c7d2da;
  cursor: not-allowed;
}

/* Дни, не входящие в текущий месяц */
.df-cell-trigger[data-outside-view] {
  color: #b6c2cd;
}
</style>
