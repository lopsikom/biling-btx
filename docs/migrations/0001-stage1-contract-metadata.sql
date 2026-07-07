-- Этап 1 рефактора метаданных (ADR-0003..0005):
-- привязка портала, зеркало метаданных полей, договор на динамических значениях.
-- Применяется руками к БД (workflow ADR-0001), затем `npm run updateDB`.

BEGIN;

-- 1. Привязка портала (portal binding, см. CONTEXT.md):
--    какой смарт-процесс — договор, какой раздел каталога — виды модулей (этап 2).
ALTER TABLE portal ADD COLUMN contract_entity_type_id integer;
ALTER TABLE portal ADD COLUMN catalog_section_id integer;

-- Сид для существующих порталов: историческое значение из бывшего env ContractIdBitrix.
UPDATE portal SET contract_entity_type_id = 1058;

-- 2. Зеркало метаданных полей (field metadata): per portal + сущность,
--    fields — полный ответ Bitrix об описаниях полей (фильтрация примитивов — в коде).
CREATE TABLE field_metadata (
    id         serial PRIMARY KEY,
    portal_id  integer     NOT NULL,
    entity     text        NOT NULL,
    fields     jsonb       NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT field_metadata_portal_fk FOREIGN KEY (portal_id)
        REFERENCES portal(id) ON DELETE CASCADE,
    CONSTRAINT field_metadata_portal_entity_uq UNIQUE (portal_id, entity)
);

-- 3. Договор: динамические значения (field values, replace-зеркало ответа Bitrix).
ALTER TABLE contract ADD COLUMN field_values jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 4. Смерть типизированных UF-колонок и справочников: их место — в field_values
--    и в метаданных полей (варианты enumeration приходят с описанием поля).
ALTER TABLE contract
    DROP COLUMN status,
    DROP COLUMN index,
    DROP COLUMN date_begin,
    DROP COLUMN date_close,
    DROP COLUMN date_sign,
    DROP COLUMN org_name,
    DROP COLUMN doc_type_id,
    DROP COLUMN original_type_id,
    DROP COLUMN prolongation_id;

DROP TABLE contract_status;
DROP TABLE contract_doc_type;
DROP TABLE contract_prolongation;
DROP TABLE contract_original_type;

COMMIT;
