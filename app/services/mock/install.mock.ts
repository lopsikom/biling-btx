// Мок-данные для превью экрана установки (install.vue) вне контекста Bitrix-iframe:
// $initializeB24Frame падает без реального Bitrix24, поэтому в dev-режиме подставляем
// тестовые смарт-процессы и раздел каталога, чтобы форму привязки можно было открыть
// и покликать в обычном браузере. См. install.vue dev-ветку (по аналогии с index.vue).

export const mockBitrixTypes = [
  { entityTypeId: 1058, title: 'Договоры' },
  { entityTypeId: 1066, title: 'Внедрение' },
  { entityTypeId: 1072, title: 'Рассылка' }
]

export interface IMockCatalogSection { id: number, iblockSectionId: number | null, name: string }

// Двухуровневый «Новый каталог» + трёхуровневая ветка (Голосовой робот → Премиум-тарифы),
// чтобы продемонстрировать каскад произвольной глубины, плюс легаси-раздел для контраста.
export const mockCatalogSections: IMockCatalogSection[] = [
  { id: 10, iblockSectionId: null, name: 'Старый каталог' },
  { id: 11, iblockSectionId: 10, name: 'Архив' },
  { id: 20, iblockSectionId: null, name: 'Новый каталог' },
  { id: 21, iblockSectionId: 20, name: 'ВАТС' },
  { id: 22, iblockSectionId: 20, name: 'Чат-бот' },
  { id: 23, iblockSectionId: 20, name: 'Голосовой робот' },
  { id: 24, iblockSectionId: 23, name: 'Премиум-тарифы' },
  { id: 25, iblockSectionId: 20, name: 'Обзвон' }
]

// Раздел, который в демо считается пустым — демонстрирует неблокирующее предупреждение
export const mockEmptyCatalogSectionIds = new Set<number>([25])
