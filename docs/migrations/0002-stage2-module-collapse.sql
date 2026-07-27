-- Этап 2 рефактора метаданных (ADR-0004, ADR-0006):
-- коллапс пяти таблиц модулей в одну `module`, вырезание тарифов.
-- Применяется руками к БД (workflow ADR-0001), затем `npm run updateDB`.
-- ПЕРЕД применением: сдампить бэкап (apply-migration-2.mjs backup) — там tariff и модули.

BEGIN;

-- 1. Привязка портала: явный список товаров-видов модулей (ADR-0006).
--    Заменяет несостоявшийся catalog_section_id (виды разбросаны по разделам).
ALTER TABLE portal ADD COLUMN module_product_ids integer[] NOT NULL DEFAULT '{}';
ALTER TABLE portal DROP COLUMN catalog_section_id;

-- 2. Единая таблица модуля (ADR-0004). Системные колонки + field_values (JSONB).
--    parent_product_id — вид модуля (parentId offer'а в каталоге).
CREATE TABLE module (
    id                serial PRIMARY KEY,
    portal_id         integer     NOT NULL,
    contract_id       integer,
    bitrix_id         integer     NOT NULL,          -- id product row в договоре
    product_id        integer,                       -- id offer'а в каталоге
    parent_product_id integer     NOT NULL,          -- вид модуля
    title             text        NOT NULL,
    price             real        NOT NULL DEFAULT 0,
    quantity          integer     NOT NULL DEFAULT 1,
    active            boolean     NOT NULL DEFAULT true,
    field_values      jsonb       NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT module_portal_fk   FOREIGN KEY (portal_id)   REFERENCES portal(id)   ON DELETE CASCADE,
    CONSTRAINT module_contract_fk FOREIGN KEY (contract_id) REFERENCES contract(id) ON DELETE SET NULL,
    CONSTRAINT module_portal_bitrix_uq UNIQUE (portal_id, bitrix_id)
);
CREATE INDEX module_contract_idx ON module(contract_id);
CREATE INDEX module_parent_idx   ON module(parent_product_id);

-- 3. Перенос виджетского атрибута `active` из пяти старых таблиц (ADR: пересинк из
--    Bitrix его не восстановит). tariff_id не переносим — тарифы вырезаны.
--    Переносим строки с непустым bitrix_id: id product row = ключ будущего module.
INSERT INTO module (portal_id, contract_id, bitrix_id, product_id, parent_product_id, title, price, active, quantity, field_values)
SELECT portal_id, contract_id, bitrix_id, product_id, 0, title, price, COALESCE(active, true), 1, '{}'::jsonb
  FROM vats            WHERE bitrix_id IS NOT NULL
UNION ALL
SELECT portal_id, contract_id, bitrix_id, product_id, 0, title, price, active, lines_count, '{}'::jsonb
  FROM chat_bot        WHERE bitrix_id IS NOT NULL
UNION ALL
SELECT portal_id, contract_id, bitrix_id, product_id, 0, title, price, COALESCE(active, true), 1, '{}'::jsonb
  FROM voice_robot     WHERE bitrix_id IS NOT NULL
UNION ALL
SELECT portal_id, contract_id, bitrix_id, product_id, 0, title, price, COALESCE(active, true), 1, '{}'::jsonb
  FROM webform         WHERE bitrix_id IS NOT NULL
UNION ALL
SELECT portal_id, contract_id, bitrix_id, product_id, 0, title, price, active, quantity, '{}'::jsonb
  FROM autoinformation_module WHERE bitrix_id IS NOT NULL
ON CONFLICT (portal_id, bitrix_id) DO NOTHING;
-- parent_product_id проставлен 0 (плейсхолдер): восстановится пересинком из Bitrix
-- (parentId offer'а). active/quantity — сохранены из старых таблиц.

-- 4. Снос старой схемы модулей: junction'ы → таблицы модулей → лукапы → тарифы.
DROP TABLE chat_bot_messengers;
DROP TABLE webform_webform_type;
DROP TABLE vats;
DROP TABLE chat_bot;
DROP TABLE voice_robot;
DROP TABLE webform;
DROP TABLE autoinformation_module;
DROP TABLE messengers;
DROP TABLE webform_type;
DROP TABLE autoinformation_type;
DROP TABLE tariff;

COMMIT;
