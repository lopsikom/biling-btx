import type { IContract, IModule, IModuleMetadataResponse, IMetadataResponse } from '~~/shared/models/APIModels'

// Фронтовые моки договоров, модулей и метаданных для локальной разработки без живого Bitrix.
// Значения согласованы с реальной метадатой портала 9 (виды/поля/варианты enum),
// чтобы DynamicField и селекторы рендерились как на проде. См. index.vue dev-ветку.

// Метаданные договора (столбцы таблицы + фильтры + форма). Повторяет форму crm.item.fields.
export const mockContractMetadata: IMetadataResponse = {
  configured: true,
  fields: [
    { code: 'ufCrm7_startDate', title: 'Дата начала документа', type: 'date', isRequired: false, isMultiple: false },
    { code: 'ufCrm7_endDate', title: 'Дата окончания документа', type: 'date', isRequired: false, isMultiple: false },
    { code: 'ufCrm7_docNumber', title: '№ документа', type: 'string', isRequired: false, isMultiple: false },
    {
      code: 'ufCrm7_docType', title: 'Тип документа', type: 'enumeration', isRequired: false, isMultiple: false,
      items: [{ id: '101', value: 'Основной' }, { id: '102', value: 'Доп. соглашение' }]
    },
    {
      code: 'ufCrm7_state', title: 'Состояние', type: 'enumeration', isRequired: false, isMultiple: false,
      items: [{ id: '201', value: 'Активен' }, { id: '202', value: 'Расторгнут' }]
    }
  ]
}

// Метаданные каталога (виды модулей + поля вида). Повторяет /api/metadata/module.
export const mockModuleMetadata: IModuleMetadataResponse = {
  configured: true,
  kinds: [
    { parent_product_id: 4930, name: 'Обзвон', category_id: 39, category_name: 'Автоинформирование' },
    { parent_product_id: 4940, name: 'Голосовой робот', category_id: 38, category_name: 'Голосовой робот' },
    { parent_product_id: 4965, name: 'Интеллектуальный Чат-бот', category_id: 40, category_name: 'Чат-бот' }
  ],
  fieldsByKind: {
    4930: [
      {
        code: 'property308', title: 'Тариф АИ в обзвоне', type: 'enumeration', isRequired: false, isMultiple: false,
        items: [{ id: '301', value: 'без РР' }, { id: '302', value: 'с РР' }]
      },
      {
        code: 'property309', title: 'Канал связи', type: 'enumeration', isRequired: false, isMultiple: false,
        items: [{ id: '311', value: 'КСЗ' }, { id: '312', value: 'SIP' }]
      }
    ],
    4940: [
      {
        code: 'property310', title: 'Тариф голосового робота', type: 'enumeration', isRequired: false, isMultiple: false,
        items: [{ id: '89', value: 'Базовый' }, { id: '90', value: 'Расширенный' }]
      },
      {
        code: 'property311', title: 'Кол-во линий', type: 'enumeration', isRequired: false, isMultiple: false,
        items: [{ id: '91', value: '1' }, { id: '92', value: '3' }, { id: '95', value: '10' }]
      }
    ],
    // Чат-бот: flag-каналы (L-свойства «Да»/«-» → boolean) — кандидаты на мультиселект
    4965: [
      { code: 'property318', title: 'Tg', type: 'boolean', isRequired: false, isMultiple: false, trueEnumId: '120' },
      { code: 'property319', title: 'Виджет', type: 'boolean', isRequired: false, isMultiple: false, trueEnumId: '121' },
      { code: 'property321', title: 'VK', type: 'boolean', isRequired: false, isMultiple: false, trueEnumId: '123' }
    ]
  },
  // Группа «Мессенджеры» у чат-бота — три boolean-канала как один мультиселект
  groupsByKind: {
    4965: [{ name: 'Мессенджеры', fields: ['property318', 'property319', 'property321'] }]
  }
}

// Договоры (company_id = 2 — совпадает с mock-компанией в dev-ветке index.vue).
export const mockContracts: IContract[] = [
  {
    id: 1, bitrix_id: 1001, name: 'Договор № 01/2026 (Обзвон + Голосовой робот)', company_id: 2,
    values: { ufCrm7_startDate: '2026-01-15T00:00:00Z', ufCrm7_docNumber: '01/2026', ufCrm7_docType: 101, ufCrm7_state: 201 }
  },
  {
    id: 2, bitrix_id: 1002, name: 'Договор № 02/2026 (SMS-рассылка)', company_id: 2,
    values: { ufCrm7_startDate: '2026-03-01T00:00:00Z', ufCrm7_docNumber: '02/2026', ufCrm7_docType: 102, ufCrm7_state: 201 }
  }
]

// Модули (привязаны к mock-договорам, виды/поля из mockModuleMetadata).
export const mockModules: IModule[] = [
  {
    id: 1, bitrix_id: 2001, product_id: 5001, parent_product_id: 4930, contract_id: 1,
    title: 'Обзвон 6 линий', price: 16000, quantity: 1, active: true,
    values: { property308: '301', property309: '311' }
  },
  {
    id: 2, bitrix_id: 2002, product_id: 5002, parent_product_id: 4940, contract_id: 1,
    title: 'Голосовой робот Базовый', price: 8000, quantity: 3, active: true,
    values: { property310: '89', property311: '95' }
  },
  {
    id: 3, bitrix_id: 2003, product_id: 5003, parent_product_id: 4930, contract_id: 2,
    title: 'Обзвон 3 линии', price: 9000, quantity: 1, active: false,
    values: { property308: '302', property309: '312' }
  }
]
