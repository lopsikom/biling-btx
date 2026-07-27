-- Видимость полей модуля в форме (field visibility, вкладка «Поля» → режим «Модули»).
-- Виджетная настройка портала поверх зеркала метаданных каталога: Bitrix про неё не
-- знает — это чисто презентационное решение виджета (см. CONTEXT.md → field visibility),
-- симметрично field_group (0003-field-groups.sql).
-- Одна строка на (портал, вид): hidden_fields — коды скрытых свойств offer'а этого вида.
-- По умолчанию поле видимо: хранятся только отклонения (что скрыто), а не полный список.
-- Применяется руками к БД (workflow ADR-0001), затем `npm run updateDB`.

BEGIN;

CREATE TABLE field_visibility (
    id                serial      PRIMARY KEY,
    portal_id         integer     NOT NULL,
    parent_product_id integer     NOT NULL,               -- вид модуля (parentId offer'а)
    hidden_fields     text[]      NOT NULL DEFAULT '{}',   -- скрытые коды свойств: {property318, ...}
    CONSTRAINT field_visibility_portal_fk FOREIGN KEY (portal_id)
        REFERENCES portal(id) ON DELETE CASCADE,
    CONSTRAINT field_visibility_portal_kind_uq UNIQUE (portal_id, parent_product_id)
);

COMMIT;
