<script setup lang="ts">
import { Icon } from '@iconify/vue'
import useToastStore from '~/services/stores/toastStore'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import type { IUser, SelectorObject } from '~/services/models'
import type { AssignableRole, IUserRole } from '~~/shared/models/APIModels'

// Управление ролью «админ»/«менеджер»/«наблюдатель» (ADR-0007, ADR-0008).
// Страница целиком admin-only — видимость вкладки гейтится в index.vue по
// bitrixStateStore.isAdmin, но сам API тоже проверяет роль на сервере
// (см. server/api/portal/roles.*). «Админ» здесь — независимый от Bitrix
// грант виджета: не отнимает права у реального админа Bitrix-портала (тот
// всё равно вычисляется отдельно и не понижается через этот UI), но
// позволяет выдать полный доступ и без него.
// Поток: выбрать сотрудника (тот же UserSelector, что и «Ответственный» в
// EditContract.vue) → селектор роли, предзаполненный текущей → «Сохранить».
const toastStore = useToastStore()
const bitrixStateStore = useBitrixStateStore()
const { $axios } = useNuxtApp()

const isLoad = ref<boolean>(false)
const isSaving = ref<boolean>(false)
// Роль виджета живёт у нас (id = user_bitrix.id), а UserSelector работает
// с bitrix-пользователями (ID = bitrix_id) — сопоставляем по bitrix_id.
const roles = ref<IUserRole[]>([])

const portalUsers = computed(() => bitrixStateStore.bitrixPortalUsers)
const selectedUser = ref<IUser>()
const selectedRole = computed(() => roles.value.find(r => r.bitrix_id === selectedUser.value?.ID))

const roleItems: SelectorObject[] = [
  { label: 'admin', value: 'Администратор' },
  { label: 'manager', value: 'Менеджер' },
  { label: 'viewer', value: 'Наблюдатель' }
]
const pendingRoleOption = ref<SelectorObject>()

// При смене сотрудника подставляем в селектор роли его текущую роль
// (дефолт — 'наблюдатель', если гранта в БД нет).
watch(selectedRole, (r) => {
  pendingRoleOption.value = roleItems.find(i => i.label === (r?.role ?? 'viewer'))
})

const hasChanges = computed(() =>
  !!selectedRole.value && !!pendingRoleOption.value && pendingRoleOption.value.label !== selectedRole.value.role
)

onMounted(async () => {
  isLoad.value = true
  try {
    roles.value = await $axios.getPortalRoles()
  } catch (e) {
    console.error(e)
  } finally { isLoad.value = false }
})

async function save() {
  const role = selectedRole.value
  const option = pendingRoleOption.value
  if (!role || !option || !hasChanges.value) return
  isSaving.value = true
  try {
    const newRole = option.label as AssignableRole
    await $axios.patchPortalRole({ user_bitrix_id: role.id, role: newRole })
    role.role = newRole
    toastStore.openToast('Роль обновлена')
  } catch (e) {
    console.error(e)
  } finally { isSaving.value = false }
}
</script>

<template>
  <div class="flex flex-col">
    <div class="any-white-container px-5 py-4 flex flex-col">
      <div class="flex flex-col gap-1">
        <span class="select-none font-semibold">Роли</span>
      </div>
      <div
        v-if="isLoad"
        class="flex items-center justify-center py-10"
      >
        <Icon
          icon="line-md:loading-loop"
          class="text-blue-600"
          width="40"
        />
      </div>
      <template v-else-if="portalUsers.length">
        <div class="flex mt-5 gap-5 items-end">
          <UserSelector
            v-model="selectedUser"
            title="Сотрудник"
            :items="portalUsers"
            :width="300"
            :selfexclude="true"
          />
          <Selector
            v-if="selectedUser"
            v-model="pendingRoleOption"
            title="Роль"
            :items="roleItems"
            :width="220"
          />
          <div
            v-if="selectedUser"
            class="save-btn items-center flex px-3 py-2"
            :class="{ 'save-btn-disabled': !hasChanges || isSaving }"
            @click="save()"
          >
            <span class="select-none text-sm text-slate-50 font-semibold">{{ isSaving ? 'Сохранение…' : 'Сохранить' }}</span>
          </div>
        </div>
        <div
          v-if="selectedUser && !selectedRole"
          class="text-gray-500 text-sm select-none mt-3"
        >
          Этот пользователь ещё не синхронизирован с виджетом — роль назначить нельзя
        </div>
      </template>
      <div
        v-else
        class="flex items-center justify-center py-10 text-gray-500 select-none"
      >
        На портале пока нет пользователей
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/any-container.css';
.save-btn{
    background: #3182ce;
    border-radius: 5px;
    cursor: pointer;
    height: fit-content;
}
.save-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}
.save-btn-disabled{
    background: #a0aec0;
    cursor: default;
    pointer-events: none;
}
</style>
