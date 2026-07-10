<script setup lang="ts">
import { Icon } from '@iconify/vue'
import usebillingStateStore from '~/services/stores/billingStateStore'
import useBitrixStateStore from '~/services/stores/bitrixStateStore'
import useMenuStore from '~/services/stores/menuStores'
import useModalStore from '~/services/stores/modalStore'
import useToastStore from '~/services/stores/toastStore'
import type { SelectorObject } from '~/services/models'
import type { IContractUpdate } from '~~/shared/models/APIModels'

const billingStateStore = usebillingStateStore()
const bitrixStateStore = useBitrixStateStore()
const modalStore = useModalStore()
const menuStore = useMenuStore()
const toastStore = useToastStore()
const { $axios } = useNuxtApp()

const { EditContract } = storeToRefs(modalStore)

const contractId = ref<number>()
const name = ref<string>('')
const selectMyCompany = ref<SelectorObject>()
// Значения динамических полей: инициализируются из values договора (replace-зеркала Bitrix)
const values = ref<Record<string, unknown>>({})

const fields = computed(() => billingStateStore.contractFields)
const selectMyCompanyItems = computed<SelectorObject[]>(() => bitrixStateStore.bitrixisMyCompanys.map(c => ({ label: c.id, value: c.title })))

onMounted(() => {
  if (!EditContract.value) { modalStore.hideModal(); return }
  contractId.value = EditContract.value.id
  name.value = EditContract.value.name
  for (const field of fields.value) {
    const v = EditContract.value.values?.[field.code]
    if (v !== undefined && v !== null) values.value[field.code] = structuredClone(toRaw(v))
  }
  // mycompanyId — системное поле Bitrix, лежит в values как часть зеркала целиком (не в contractFields)
  const mycompanyId = EditContract.value.values?.mycompanyId
  if (mycompanyId !== undefined && mycompanyId !== null) {
    selectMyCompany.value = selectMyCompanyItems.value.find(i => String(i.label) === String(mycompanyId))
  }
})

function isEmptyValue(v: unknown) {
  return v === undefined || v === null || String(v).trim() === ''
}

async function saveData() {
  menuStore.fetchDataLoad = true
  try {
    if (isEmptyValue(name.value)) throw new Error('Validation Error')
    if (!selectMyCompany.value) throw new Error('Validation Error')
    for (const field of fields.value) {
      if (field.isRequired && isEmptyValue(values.value[field.code])) throw new Error('Validation Error')
    }
    const data: IContractUpdate = {
      name: name.value,
      mycompany_id: selectMyCompany.value?.label as number | undefined,
      values: { ...values.value }
    }
    const newContract = await $axios.patchContract(data, contractId.value!)
    const index = billingStateStore.contracts.findIndex(c => c.id === newContract.id)
    if (index > -1) billingStateStore.contracts[index] = newContract
    toastStore.openToast('Данные сохраненны')
    EditContract.value = null
    modalStore.hideModal()
  } catch (e) {
    console.error(e)
    if ((e as Error).message === 'Validation Error') toastStore.openToast('Не все поля правильно заполнены или заполнены некорректно')
    else toastStore.openToast('Не удалось сохранить договор')
  } finally { menuStore.fetchDataLoad = false }
}

async function deleteData() {
  const data = await $axios.deleteContract(contractId.value!)
  if (data) toastStore.openToast('Договор успешно удалён')
  else toastStore.openToast('Не удалось удалить договор')
  EditContract.value = null
  billingStateStore.isRefreshContracts = true
  modalStore.hideModal()
}
</script>

<template>
  <div class="flex mb-[35px]">
    <div class="flex flex-col">
      <span class="text-lg font-semibold select-none">Редактирование договора</span>
      <span class="text-gray-500 text-sm select-none">изменение данных договора</span>
    </div>
    <div
      style="margin-left: auto; margin-top: 5px;"
      @click="modalStore.hideModal"
    >
      <Icon icon="maki:cross" />
    </div>
  </div>
  <div class="assign-modal">
    <div
      class="any-white-container p-5 gap-2 flex flex-col"
      style="width: 100%;"
    >
      <div class="flex">
        <span class="font-semibold mb-[20px] select-none">Поля договора</span>
      </div>
      <div class="flex flex-col gap-3">
        <div class="flex gap-[10px]">
          <InputBox
            v-model="name"
            placeholder="Введите название..."
            :resize="false"
            :required="true"
            title="Название договора"
            style="width: 100%;"
          />
        </div>
        <div class="flex gap-[10px]">
          <Selector
            v-model="selectMyCompany"
            style="width: 100%;"
            title="Организация"
            :required="true"
            :items="selectMyCompanyItems"
          />
        </div>
        <div
          v-if="fields.length"
          class="fields-grid"
        >
          <DynamicField
            v-for="field in fields"
            :key="field.code"
            v-model="values[field.code]"
            :field="field"
          />
        </div>
        <div
          v-else
          class="text-gray-500 text-sm select-none"
        >
          Поля договора не настроены: проверьте привязку смарт-процесса на странице «Поля»
        </div>
      </div>
    </div>
  </div>
  <div
    class="flex mt-[35px] gap-[20px]"
    style="margin-left: auto; width: 100%; flex-direction: row-reverse;"
  >
    <div
      class="save-btn justify-center items-center px-[10px] py-[8px]"
      @click="saveData()"
    >
      <p
        class="select-none text-sm"
        style="color: white;"
      >
        Сохранить
      </p>
    </div>
    <div
      class="close-btn blue-hover justify-center items-center px-[10px] py-[8px]"
      @click="modalStore.hideModal()"
    >
      <p class="select-none hover-item text-sm">
        Отмена
      </p>
    </div>
    <div
      class="delete-btn justify-center items-center px-[10px] py-[8px]"
      style="margin-right: auto;"
      @click="deleteData()"
    >
      <p
        class="select-none text-sm"
        style="color: white;"
      >
        Удалить
      </p>
    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/any-container.css';
.save-btn{
    background: #3182ce;
    border-radius: 5px;
}
.delete-btn{
    background: #e53e3e;
    border-radius: 5px;
}
.delete-btn:hover{
    background: #fd3d3d;
    transition: background 0.15s ease;
}
.close-btn{
    border-color: #e7eaee;
    border-width: 1.5px;
    border-radius: 5px;
}
.assign-modal{
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    height: 100%;
}
.fields-grid{
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 15px 10px;
}
.blue-hover:hover{
    background-color: #ebf8ff;
    transition: background-color 0.15s ease;
}
.save-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}
</style>
