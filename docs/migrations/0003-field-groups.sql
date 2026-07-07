-- Мультиселект-группы полей модулей (field group, подэтап 2.5 / ADR-0006).
-- Раньше мессенджеры/чат-боты были единым мультиселектом; после коллапса это
-- отдельные boolean-свойства offer'а. Группа объединяет их обратно в один
-- мультиселект в форме модуля. Задаётся вручную на вкладке «Поля» (режим модулей).
-- Отдельная таблица (не в portal): portal остаётся служебной (домен/токены/секреты).
-- Применяется руками к БД (workflow ADR-0001), затем `npm run updateDB`.

BEGIN;

-- Группа полей вида модуля: имя + коды объединяемых boolean-свойств.
-- portal_id — инвариант мультитенантности; parent_product_id — вид, к которому относится группа.
CREATE TABLE field_group (
    id                serial      PRIMARY KEY,
    portal_id         integer     NOT NULL,
    parent_product_id integer     NOT NULL,          -- вид модуля (parentId offer'а)
    name              text        NOT NULL,          -- имя группы («Мессенджеры»)
    fields            text[]      NOT NULL DEFAULT '{}',  -- коды свойств: {property318, property319, ...}
    CONSTRAINT field_group_portal_fk FOREIGN KEY (portal_id)
        REFERENCES portal(id) ON DELETE CASCADE
);

CREATE INDEX field_group_portal_kind_idx ON field_group (portal_id, parent_product_id);

COMMIT;
