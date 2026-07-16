<script setup lang="ts">
import { Icon } from '@iconify/vue'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import type { IUser } from '~/services/models'

const props = withDefaults(defineProps<{
  items: IUser[]
  title?: string
  width?: number
  required?: boolean
  disabled?: boolean
}>(), {
  required: false,
  disabled: false
})

const bitrixStateStore = useBitrixStateStore()

const model = defineModel<IUser>()
const error = defineModel<boolean>('error', { default: false })

const touched = ref(false)

const isEmpty = computed(() => !model.value)
const hasError = computed(() => error.value || (props.required && touched.value && isEmpty.value))

// ФИО в коротком формате (как в AssignUserModal/MainPage) — и для отображения, и для displayValue инпута
function shortName(user?: IUser): string {
  return user ? bitrixStateStore.getShortName(user) : ''
}

// Полнотекстовая строка для поиска Combobox: имя целиком + должность, а не сокращённое ФИО
function searchText(user: IUser): string {
  return [user.NAME, user.SECOND_NAME, user.LAST_NAME, user.WORK_POSITION].filter(Boolean).join(' ')
}

function byId(a?: IUser, b?: IUser) {
  return String(a?.ID) === String(b?.ID)
}
</script>

<template>
  <div class="flex flex-col gap-[5px]">
    <span
      v-if="title"
      class="select-none font-semibold text-sm"
    >{{ title }}</span>
    <ComboboxRoot
      v-model="model"
      :by="byId"
      :disabled="disabled"
      :style="width ? `width:${width}px` : ''"
    >
      <ComboboxAnchor
        class="select-menu gap-[10px] text-sm"
        :class="{ 'select-menu-error': hasError }"
        @focusout="touched = true; error = false"
      >
        <AvatarRoot style="width: 24px; height: 24px; flex-shrink: 0;">
          <AvatarImage
            :src="model?.PERSONAL_PHOTO ?? ''"
            class="w-full h-full"
            style="border-radius: 50%;"
          />
          <AvatarFallback>
            <div
              class="flex items-center justify-center w-full h-full"
              style="border-radius: 50%; background-color: #eaf2fa;"
            >
              <Icon
                icon="lucide:user"
                class="w-3.5 h-3.5 text-sky-600"
              />
            </div>
          </AvatarFallback>
        </AvatarRoot>
        <ComboboxInput
          :display-value="(v) => shortName(v as IUser)"
          placeholder="Выберите сотрудника..."
          class="combobox-input text-sm"
        />
        <ComboboxTrigger style="margin-left: auto;">
          <Icon icon="radix-icons:chevron-down" />
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxPortal>
        <ComboboxContent
          :side-offset="2"
          align="end"
          class="p-[5px]"
          style="background: white; z-index: 999; border-color: #e7eaee; border-width: 1.5px; border-radius: 10px;;"
          position="popper"
          hide-when-detached
          update-position-strategy="always"
        >
          <ComboboxViewport style="max-height: 260px; overflow-y: auto; scrollbar-width: thin;">
            <ComboboxEmpty class="user-select-item text-gray-500">
              Ничего не найдено
            </ComboboxEmpty>
            <ComboboxItem
              v-for="user in items"
              :key="user.ID"
              :value="user"
              :text-value="searchText(user)"
              class="user-select-item gap-[10px]"
            >
              <AvatarRoot style="width: 28px; height: 28px; flex-shrink: 0;">
                <AvatarImage
                  :src="user.PERSONAL_PHOTO ?? ''"
                  class="w-full h-full"
                  style="border-radius: 50%;"
                />
                <AvatarFallback>
                  <div
                    class="flex items-center justify-center w-full h-full"
                    style="border-radius: 50%; background-color: #eaf2fa;"
                  >
                    <Icon
                      icon="lucide:user"
                      class="w-4 h-4 text-sky-600"
                    />
                  </div>
                </AvatarFallback>
              </AvatarRoot>
              <div
                class="flex flex-col"
                style="overflow: hidden;"
              >
                <span class="cell-ellipsis">{{ shortName(user) }}</span>
                <span
                  v-if="user.WORK_POSITION"
                  class="text-gray-500 text-xs cell-ellipsis"
                >{{ user.WORK_POSITION }}</span>
              </div>
              <ComboboxItemIndicator style="margin-left: auto;">
                <Icon
                  icon="radix-icons:check"
                  class="text-gray-600"
                />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
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
    width: 100%;
}
.select-menu-error{
    background-color: #fff0f0;
    border-color: #e53e3e;
    transition: border-color 0.15s ease;
}
.select-menu[data-disabled]{
    opacity: 0.6;
    cursor: not-allowed;
}
.combobox-input{
    background-color: transparent;
    border: none;
    outline: none;
    width: 100%;
    text-overflow: ellipsis;
}
.cell-ellipsis{
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}
.user-select-item{
    font-size: 13px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    min-height: 44px;
    min-width: 300px;
    padding: 6px 10px;
    position: relative;
    user-select: none;
}
.user-select-item[data-highlighted]{
    outline: none;
    background-color: #ebf8ff;
    transition: background-color 0.05s ease;
}
</style>
