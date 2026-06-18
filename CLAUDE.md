# biling-btx

Виджет биллинга для Bitrix24. Nuxt 4 SPA (фронт) + Nitro (бэк), который зеркалит CRM-сущности из Bitrix24 в Postgres по каждому порталу (мультитенантность) и управляет биллинговыми договорами и модулями.

## Стек

- **Фронт:** Nuxt 4 (`ssr: false` → SPA), Pinia, Bitrix24 UI (`@bitrix24/b24ui-nuxt`), Bitrix JS SDK. baseURL `/billing/`.
- **Бэк:** Nitro (server routes + plugins), Prisma 7 + Postgres (`@prisma/adapter-pg`), ioredis.
- **Интеграция:** Bitrix24 OAuth + вебхуки (события CRM).

## Архитектура и доменная модель

### Мультитенантность — главный инвариант

`portal` = один установленный экземпляр приложения на конкретном Bitrix24-аккаунте (домене). Это ось изоляции данных. Почти каждая таблица несёт `portal_id`, а уникальные ключи составные с порталом (`@@unique([bitrix_id, portal_id])`).

- Тенант определяется в middleware [server/middleware/requirePortal.ts](server/middleware/requirePortal.ts): по заголовку `Authorization` (токен Bitrix-пользователя) → резолв в `portal` → кеш в Redis (`token:<token>`, TTL 300с). Результат кладётся в `event.context.portal` = `{ portal, user_id, bitrix_user_id }`.
- Middleware висит на всех `/api/**`, кроме `/api/oauth/**` и `/api/bitrix/webhook`.
- **В API-хендлерах портал берётся из `event.context.portal`, а не из тела запроса. Любой запрос к данным фильтруется по `portal_id`** — иначе утечка данных между тенантами.
- В dev-режиме (`NUXT_PUBLIC_DEV` + `NUXT_DEV_SKIP_AUTH`) портал берётся из `NUXT_DEV_*` env, авторизация пропускается.

### Направление синхронизации с Bitrix

- **CRM-сущности — только зеркало из Bitrix → Postgres** (для целостности связей, не пишутся обратно): `company`, `contact`, `invoice`, `requisite`, `address`, `user_bitrix`. В `raw_json` хранится сырой ответ Bitrix.
- **`contract` и биллинговые модули — двунаправленные:** могут приходить из Bitrix (вебхуки/sync) **и** создаваться в самом виджете (тогда уходят в Bitrix через `bitrixAPI`). Модули: `vats`, `chat_bot`, `voice_robot`, `webform`, `autoinformation_module`. Все привязываются к `contract` и `tariff`.

Два механизма синка:
- **Реактивный:** вебхуки Bitrix → [server/api/bitrix/webhook.post.ts](server/api/bitrix/webhook.post.ts) парсит form-encoded payload (`qs`) и эмитит событие через [server/services/webHooksEvents.ts](server/services/webHooksEvents.ts). Защита от гонок/дублей — `webHookLocker` в Redis.
- **Проактивный:** [server/services/syncService.ts](server/services/syncService.ts), инициализируется nitro-плагином `syncService-init.ts` при старте сервера.

### `events` — аудит-лог

Таблица `events` (`userid, action, entity, ...`) — лог действий пользователя в виджете (не доменные события синка). Читается через [server/api/event.list.get.ts](server/api/event.list.get.ts), пишется через [server/services/EventsAudit.ts](server/services/EventsAudit.ts).

## ⚠️ Prisma: схема интроспектится из БД, а не наоборот

**Source of truth для структуры БД — сама БД, а не `schema.prisma`.** Изменения схемы делаются прямо в Postgres (SQL вручную), затем подтягиваются в Prisma:

```bash
npm run updateDB   # prisma db pull && prisma generate
```

- **НЕ править `schema.prisma` руками. НЕ запускать `prisma migrate`** — это сломает workflow.
- Сгенерированный клиент лежит в `server/services/models/generated/prisma/**` — **тоже не трогать руками**, перегенерируется командой выше.
- Отсюда в схеме встречаются snake_case-имена и опечатки из БД (`tarrif_id`, `last_activty_by`) — это нормально, так в базе.

Эти два места — единственное, что нельзя править вручную.

## Структура кода

### Сервер (`server/`)
- `api/**` — Nitro-роуты. Конвенция именования: `entity.action.method.ts` (напр. `contract.list.get.ts`, `connection.add.post.ts`). Операции по id — в папках: `connection/[id].patch.ts`. Биллинговые модули — в `api/modules/`.
- `utils/prisma/**` — слой доступа к данным, по файлу на сущность (`getCompany.ts`, `postInvoice.ts`, `Contract.ts`). Модули — в `utils/prisma/modules/`.
- `services/bitrix/**` — клиент Bitrix REST (`bitrixAPI.ts`, `CompanyClient.ts`).
- `services/{syncService,webHooksEvents,EventsAudit,redis}.ts` — фоновые/инфраструктурные сервисы.
- `api/oauth/**` — установка приложения и OAuth (`handler.ts`, `verify.install.ts`).

### Фронт (`app/`)
- `pages/` — `index.vue` (виджет), `install.vue` (установка).
- `components/pages/` — «страницы» виджета (MainPage, billingPage, UsersPage, EventsPage, …).
- `components/modals/` — модалки (AddContract, AddConnection, InvoiceModal, …).
- `services/stores/` — Pinia stores.
- `services/models/` — типы/енумы/интерфейсы фронта.

### Общее
- `shared/models/**` — типы, общие для фронта и бэка (`bitrixModels.ts`, `APIModels.ts`).

## Команды

```bash
npm run dev          # nuxt dev --host (лимит памяти 1536МБ)
npm run dev:local    # то же + NUXT_PUBLIC_DEV=true (включает dev-обход авторизации)
npm run lint         # eslint
npm run typecheck    # nuxt typecheck
npm run build        # сборка
npm run start        # прод: node .output/server/index.mjs
npm run updateDB     # подтянуть схему из БД (см. раздел про Prisma)
```

**Перед коммитом** желательно прогнать `npm run lint` и `npm run typecheck`.

## Локальный запуск

- Бэку нужны **живые Postgres и Redis**. Mock-режима для бэка нет — моки в `app/services/mock/` только фронтовые.
- `.env.example` нет. Обязательные env (рантайм): `NUXT_DATABASE_URL`, `NUXT_REDIS_URL`, `NUXT_REDIS_PORT`, `NUXT_AUTH_URI`, `NUXT_PUBLIC_BASE_URL`/`NUXT_PUBLIC_BASE_URI`.
- Для dev-обхода авторизации без живого Bitrix: `NUXT_PUBLIC_DEV=true`, `NUXT_DEV_SKIP_AUTH`, плюс `NUXT_DEV_PORTAL_ID`, `NUXT_DEV_CLIENT_ID`, `NUXT_DEV_CLIENT_SECRET`, `NUXT_DEV_DOMAIN`, `NUXT_DEV_REFRESH_TOKEN`, `NUXT_DEV_USER_ID`, `NUXT_DEV_USER_BITRIX_ID`.

---

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues (`lopsikom/biling-btx`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage labels are used as-is (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
