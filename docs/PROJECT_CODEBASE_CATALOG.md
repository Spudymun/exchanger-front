# Каталог кодовой базы (подтверждено)

Источник структуры: project-structure.txt (2025-08-08) + ARCHITECTURE.md. Описания основаны на фактических путях/именах файлов и документации — без предположений.

## Монорепозиторий: верхний уровень

- apps/ — приложения (Next.js)
  - web/ — основное приложение (App Router)
  - admin-panel/ — админ-панель (App Router)
  - docs/ — сайт документации (App Router)
- packages/ — общие пакеты
  - constants/, exchange-core/, hooks/, providers/, tailwind-preset/, ui/, utils/, eslint-config/, design-tokens/, style-scanner/, typescript-config/
- scripts/ — служебные скрипты
- tests/ — e2e тесты (Playwright)
- style-docs/, storybook-static/ — артефакты/документация по стилям и Storybook

## Архитектурные слои (из ARCHITECTURE.md + подтверждено файлами)

- Приложения (apps/\*)
  - Next.js 15, App Router: layout.tsx, error.tsx, not-found.tsx, loading.tsx
  - Локализация: web/app/[locale]/
- Пакеты общего пользования (packages/\*)
  - constants — бизнес-константы и конфигурации
  - exchange-core — доменные типы/утилиты (types-first)
  - hooks — shared hooks + Zustand stores
  - providers — React-провайдеры и интеграции
  - ui — UI-компоненты (shadcn/ui-паттерны)
  - utils — утилиты (валидации, форматирование, бизнес-хелперы)
  - tailwind-preset — централизованные CSS переменные и пресет
  - design-tokens — токены дизайна
  - eslint-config, typescript-config — конфигурации
  - style-scanner — служебный сканер структуры/стилей

## apps/web (подробно)

Структура (из project-structure.txt):

- app/
  - [locale]/ — корневые маршруты по локали
  - error.tsx, layout.tsx, loading.tsx, not-found.tsx, globals.css
- messages/
  - en.json, ru.json — словари next-intl
- src/components/
  - exchange-form/ — ExchangeArrow.tsx, ExchangeBenefits.tsx, ReceivingCard.tsx, SendingCard.tsx, useHeroExchangeForm.ts
  - forms/ — AuthForms.tsx, ExchangeForm.tsx, LoginForm.tsx, RegisterForm.tsx, index.ts
  - app-footer.tsx, app-header.tsx, app-layout.tsx, auth-dialogs.tsx, ExchangeRates.tsx, FeaturesSection.tsx, FloatingExchangeButton.tsx, HeroExchangeForm.tsx, HeroSection.tsx, HowItWorksSection.tsx, OrderStatus.tsx, theme-toggle-i18n.tsx, index.ts
- src/hooks/
  - useAuthFormConfig.ts, useAuthMutationAdapter.ts, useAuthMutations.ts, useExchangeMutation.ts,
    useExchangeStoreWithTranslations.ts, useNotificationsWithTranslations.ts, usePasswordMutations.ts, useUIStoreWithTranslations.ts, index.ts
- src/i18n/
  - navigation.ts, request.ts, routing.ts — навигация/маршрутизация i18n
- src/server/
  - trpc/
    - middleware/ — auth.ts, rateLimit.ts
    - routers/
      - user/ — index.ts, orders.ts, profile.ts, security.ts
      - auth.ts, exchange.ts, fiat.ts, operator.ts, shared.ts, support.ts, index.ts
    - context.ts, init.ts, index.ts
  - utils/ — delay.ts, i18n-errors.ts

Подтвержденные зависимости (примеры, по содержимому файлов):

- trpc/routers/operator.ts — импортирует ORDER_STATUS_CONFIG/ORDER_STATUSES из @repo/constants и утилиты из @repo/utils
- trpc/routers/support.ts — использует ORDER_STATUSES (@repo/constants)
- trpc/routers/user/\* — используют @repo/utils (paginate/sort/filter) и @repo/constants (статусы/константы)
- components/FloatingExchangeButton.tsx — импортирует FloatingActionButton из @repo/ui и useScrollVisibility из @repo/hooks

## apps/admin-panel

- app/ — стандартные entry файлы: layout.tsx, error.tsx, loading.tsx, not-found.tsx, page.tsx, globals.css
- next.config.mjs, tailwind.config.cjs — конфигурации

## apps/docs

- app/ — документационный сайт, layout.tsx, page.tsx, globals.css
- public/ — иконки

## packages/constants (ключевые модули)

- src/order-statuses.ts — ORDER_STATUSES, ORDER_STATUS_CONFIG, группы статусов; TICKET_STATUSES; типы/массивы для Zod
- src/exchange.ts — EXCHANGE\_\* константы, статусы процессов обмена
- src/user.ts — USER_MESSAGES/CONFIG, CANCELLABLE_ORDER_STATUSES
- src/ui.ts — UI-конфигурации (лейблы/варианты)
- src/_ — API, auth, банки, валюты, форматирование, лимиты, проценты, time, validation_

## packages/exchange-core (доменные данные/типы/утилиты)

- src/data/ — in-memory manager.ts (userManager, orderManager), mock-data.ts, mock-factory.ts
- src/services/ — crypto-address-generation.ts, id-generation.ts
- src/types/ — auth, user, order, currency, transaction, etc.
- src/utils/ — валидаторы доступа/бизнеса/данных/типов, расчеты, композиции

## packages/hooks

- src/business/ — useExchange, useOrderTracking, useFormWithNextIntl, useFormTypes, useMathCaptcha, authMessages
- src/state/ — exchange-store, notification-store, trading-store, ui-store, селекторы/хелперы
- src/ui/ — useScrollVisibility
- src/client-hooks.ts — клиентские реэкспорты (useUIStore, useNotifications, useExchangeStore и др.)
- src/useUIStore.ts, useTheme.ts, useNotifications.ts, useExchangeStore.ts — хелперы поверх сторов
- package.json — exports для TS-Direct (".", "./state", "./src/client-hooks", "./src/state/ui-store")

## packages/providers

- src/theme-provider.tsx — провайдер темы (клиентский), импортирует THEME_MODES из @repo/constants и useUIStore из @repo/hooks/src/client-hooks
- src/theme-script.tsx — скрипт для темы
- src/index.tsx — сборка провайдеров

## packages/ui

- src/components/
  - auth/\* — поля и лэйауты форм авторизации
  - data-table/\* — части таблицы данных
  - ui/\* — базовые элементы (button, card, dialog, dropdown-menu, form, input, label, select, spinner, table, textarea, notification)
  - прочее: adaptive-container.tsx, exchange-form.tsx, floating-action-button.tsx, footer.tsx, header\*.tsx, theme-toggle.tsx, tree-view.tsx и т.д.
- src/styles/ — globals.css, adaptive-container.css
- src/**tests**/ — Button.test.tsx, DataTable.test.tsx

## packages/utils

- src/validation/ — schemas/\* (basic, crypto, composed, utils), core.ts, constants.ts, hooks.ts, handlers.ts, helpers, single-field.ts
- src/ — calculations.ts, env.ts, formatting.ts, input-validation.ts, next-intl-validation.ts,
  order-status.ts (хелперы статусов), order-utils.ts (фильтры/сортировки/пагинация), scroll-utils.ts,
  store-factory.ts, trpc-errors.ts, validation-helpers.ts, validation-schemas.ts (централизованные Zod схемы)

## packages/tailwind-preset

- globals.css — единый источник CSS переменных/семантических классов
- preset.js — Tailwind пресет

## packages/design-tokens

- colors.js, spacing.js, typography.js, components.{js,tsx} — токены дизайна/документация

## packages/eslint-config, typescript-config

- Наборы правил ESLint и пресеты tsconfig

## packages/style-scanner

- src/core, scanners/_, services/_ — сканер для анализа структуры и стилей, генерация markdown-резюме (style-docs/)

## scripts

- analyze-project-structure.ps1 — генерация project-structure.txt (подтверждено временем создания)
- repo-audit.mjs, bundle-analyzer.js, checklist-reminder.mjs, validate-cleanup.js — служебные утилиты

## tests

- tests/\*.spec.ts — Playwright сценарии для приложений (admin-panel, docs, web)

## Подтверждённые связи между слоями (примеры)

- apps/web/src/server/trpc/routers/operator.ts → @repo/constants (ORDER_STATUS_CONFIG/ORDER_STATUSES), @repo/utils (paginate/filter/sort, схемы), @repo/exchange-core (orderManager)
- apps/web/src/server/trpc/routers/support.ts → @repo/constants (ORDER_STATUSES), @repo/exchange-core (userManager/orderManager)
- apps/web/src/server/trpc/routers/user/\* → @repo/utils (paginate/sort/filter, схемы), @repo/constants (USER_CONFIG, CANCELLABLE_ORDER_STATUSES)
- apps/web/src/server/trpc/routers/exchange.ts → @repo/constants (ORDER_STATUSES, лимиты), @repo/exchange-core (calculate\*/getExchangeRate), @repo/utils (схемы)
- apps/web/src/components/FloatingExchangeButton.tsx → @repo/ui (FloatingActionButton), @repo/hooks (useScrollVisibility)
- packages/providers/src/theme-provider.tsx → @repo/constants (THEME_MODES), @repo/hooks/src/client-hooks (useUIStore)

## Стратегии сборки (из ARCHITECTURE.md, применимость подтверждена файлами пакетов)

- Compiled (например, constants) — tsc → dist; есть tsup.config.ts и scripts build:\*
- TS-Direct (utils, ui, hooks) — exports на src/\*, без dist
- Types-Only (exchange-core) — основно типы/минимальный runtime
- Next.js Apps (apps/\*) — управляется next build/dev

## Примечания

- CSS архитектура: единый import @repo/tailwind-preset/globals.css в apps/\*/app/globals.css (подтверждено именами файлов)
- i18n: словари в apps/web/messages/_ и модульные файлы в src/i18n/_
- Все пункты выше опираются на актуальную project-structure.txt и содержимое отдельных прочитанных файлов.

---

## Карта зависимостей между пакетами (подтверждено по фактическим import)

Источник: скан берёт только то, что реально импортируется в коде (без предположений). Ниже — примеры файлов-импортёров; список неполный по строкам, но подтверждает связи.

- @repo/constants → импортируется в:
  - packages/utils: validation-schemas.ts, validation-helpers.ts, validation/schemas-crypto.ts, validation/schemas/basic.ts, validation/handlers.ts, input-validation.ts, formatting.ts, calculations.ts, order-utils.ts, order-status.ts
  - packages/ui: components/ui/_, components/data-table/_, components/auth/\*, theme-toggle.tsx, floating-action-button.tsx, TreeNodeItem.tsx
  - packages/providers: src/theme-provider.tsx
  - packages/hooks: useTheme.ts, state/\* (ui-store.ts, trading-store.ts, exchange-store.ts), business/useOrderTracking.ts, useFormWithNextIntl.ts/useExchange.ts
  - packages/exchange-core: types/_ (user.ts, transaction.ts, order.ts, fiat.ts, currency.ts), utils/_, services/\*, data/manager.ts
  - apps/web: server/trpc/middleware/_, server/trpc/routers/_ (auth.ts, exchange.ts, fiat.ts, operator.ts, shared.ts, support.ts, user/_), components/_ (OrderStatus.tsx, ExchangeRates.tsx, forms/_), server/utils/i18n-errors.ts, i18n/_
  - apps/admin-panel: app/page.tsx
- @repo/utils → импортируется в:
  - packages/hooks: useExchangeStore.ts, business/useFormWithNextIntl.ts, business/useExchange.ts; state/\* (ui-store.ts, trading-store.ts, exchange-store.ts, exchange-fiat-actions.ts)
  - packages/exchange-core: utils/\* (order-validators.ts, composite-validators.ts, business-validators.ts, calculations.ts, crypto.ts)
  - apps/web: server/trpc/middleware/_, server/trpc/routers/_, components/_ (forms/_, exchange-form/\*), hooks/useExchangeStoreWithTranslations.ts
- @repo/exchange-core → импортируется в:
  - packages/utils: validation/schemas-crypto.ts, validation/schemas-composed.ts, order-utils.ts, order-status.ts, input-validation.ts
  - packages/ui: **tests**/DataTable.test.tsx, stories/DataTable.stories.tsx
  - packages/hooks: state/exchange-store.ts, business/useExchange.ts, state/exchange-helpers.ts, state/exchange-fiat-actions.ts
  - apps/web: server/trpc/context.ts, routers/_ (auth.ts, exchange.ts, fiat.ts, operator.ts, shared.ts, support.ts, user/_), hooks/useExchangeMutation.ts, components/_ (forms/_, ExchangeRates.tsx, OrderStatus.tsx, exchange-form/\*)
- @repo/hooks → импортируется в:
  - packages/ui: components/auth/\* (UseFormReturn), types/auth-fields.ts
  - apps/web: components/_ (FloatingExchangeButton.tsx, forms/_), components/exchange-form/useHeroExchangeForm.ts
- @repo/providers → импортируется в:
  - packages/ui: components/theme-toggle.tsx (useTheme)
  - apps/web: app/layout.tsx (ThemeScript), src/components/app-layout.tsx (ThemeProvider)
  - apps/admin-panel: app/layout.tsx (Providers, ThemeProvider)
- @repo/ui → импортируется в:
  - apps/web: множество UI компонентов на страницах и в секциях (auth-dialogs.tsx, forms/\*, ExchangeRates.tsx, HeroExchangeForm.tsx, FloatingExchangeButton.tsx, Header/Footer и др.)
  - apps/docs, apps/admin-panel: базовые UI элементы (Button и др.)

Заключение: граф подтверждает «ядро» зависимостей — apps → (utils, constants, exchange-core, ui, providers, hooks); внутри packages — плотная связка utils ↔ hooks и utils ↔ exchange-core.

---

## apps/web — TRPC роутеры: назначения и зависимости (подтверждено import)

- routers/operator.ts
  - Импорт: { ORDER_STATUS_CONFIG, VALIDATION_LIMITS, ORDER_STATUSES } из @repo/constants; orderManager из @repo/exchange-core; paginateOrders/filterOrders/sortOrders/getOrdersStatistics/createOrderError/createBadRequestError/filterOrdersForOperator/canTransitionStatus (+ operatorOrdersSchema/updateOrderStatusSchema) из @repo/utils.
  - Роль: операции оператора над заявками (получение очереди, изменение статусов, статистика). Подтверждено используемыми утилитами и статусами.
- routers/support.ts
  - Импорт: { UI_NUMERIC_CONSTANTS, TIME_CONSTANTS, TICKET_STATUSES, ORDER_STATUSES } из @repo/constants; userManager/orderManager из @repo/exchange-core; схемы и ошибки из @repo/utils.
  - Роль: тикеты саппорта + пользовательская статистика — подтверждено данными и константами.
- routers/exchange.ts
  - Импорт: { CRYPTOCURRENCIES, ORDER_STATUSES, ... } из @repo/constants; validateCreateOrder/calculate\*/getExchangeRate/getCurrencyLimits/generateDepositAddress/sanitizeEmail/orderManager/userManager из @repo/exchange-core; схемы из @repo/utils.
  - Роль: курсы, лимиты, расчёт и создание заявок — подтверждено импортами.
- routers/user/\* (orders.ts, profile.ts, security.ts)
  - Импорт: orderManager/validate\* из @repo/exchange-core; схемы и утилиты пагинации/фильтров из @repo/utils; { USER_CONFIG, CANCELLABLE_ORDER_STATUSES, USER_SUCCESS_MESSAGES } из @repo/constants.
  - Роль: история/детали/отмена заявок, профиль и безопасность — подтверждено импортами.

---

## apps/web — Компоненты: ключевые зависимости (подтверждено import)

- components/FloatingExchangeButton.tsx → @repo/ui (FloatingActionButton), @repo/hooks (useScrollVisibility), @repo/utils (scrollToRef)
- components/OrderStatus.tsx → @repo/constants (ORDER_STATUS_CONFIG/ORDER_STATUSES/UI_REFRESH_INTERVALS), @repo/exchange-core (Order)
- components/forms/_ → @repo/ui (Auth_ поля, кнопки), @repo/hooks (useFormWithNextIntl), @repo/utils (loginSchema/registerSchema), @repo/exchange-core (LoginFormData/RegisterFormData)
- components/ExchangeRates.tsx → @repo/constants (CURRENCY_NAMES), @repo/ui (карточки/сетки), @repo/exchange-core (тип ExchangeRate)
- components/exchange-form/\* → @repo/constants (FIAT/CRYPTO), @repo/utils (cryptoAmountStringSchema/useNumericInput), @repo/exchange-core (валидации/типы)

---

## packages/hooks — Stores/бизнес-хуки и потребители (подтверждено import)

- useUIStore (client-hooks) → потребитель: packages/providers/src/theme-provider.tsx
- useFormWithNextIntl → потребители: apps/web/src/components/forms/{LoginForm,RegisterForm}.tsx, components/exchange-form/useHeroExchangeForm.ts
- state/_ (exchange-store, ui-store, trading-store, notification-store) используют @repo/utils (createStore/_) и @repo/constants (ThemeMode/дефолтные лимиты)

---

## packages/utils — используемые модули и потребители (подтверждено import)

- validation-schemas.ts, order-status.ts, order-utils.ts, formatting.ts, calculations.ts и т.д. → используются:
  - apps/web: trpc middleware/routers, компоненты форм/экченджа, серверные утилиты
  - packages/hooks: бизнес-хуки и состояние (валидации форм, дебаунс/таймеры, фабрики стора)
  - packages/exchange-core: валидаторы/расчёты/композитные проверки

---

## packages/exchange-core — центр типов/менеджеров (подтверждено import)

- types/\* (Order, User, Currency, Transaction, Fiat, CryptoCurrency) → активно импортируются в packages/utils, packages/hooks, packages/ui, apps/web компонентах и роутерах.
- data/manager.ts (userManager/orderManager) → используется в apps/web/server/trpc/{context.ts, routers/\*}.
- services/\* (id-generation, crypto-address-generation) → используются в exchange.ts.

---

## Покрытие скана и следующий шаг

- Текущий раздел отражает подтверждённые кросс-пакетные зависимости и ключевые точки использования. Источники — прямые import из исходников.
- Далее: расширяю каталог внутрипакетными связями (relative imports) и полным списком потребителей для каждого ключевого модуля (поштучно), пока не будет охвачено 100% файлов. Обновления буду вносить потоково, секциями, с точными путями.

---

## Внутренняя структура пакетов (перечень файлов, без предположений)

### packages/utils/src

- calculations.ts — числовые расчёты и проценты; потребители: exchange-core/utils/calculations.ts, apps/web/routers/\*
- env.ts — типобезопасный доступ к env
- formatting.ts — форматирование значений для UI; потребители: docs/ARCHITECTURE.md примеры, apps/web/components/\*
- index.ts — экспортная точка
- input-validation.ts — числовые/крипто-валидации; потребители: hooks/state, forms
- next-intl-validation.ts — адаптер валидации для next-intl
- order-status.ts — операции со статусами; потребители: trpc/routers/\*
- order-utils.ts — утилиты заказов; потребители: trpc/routers/\*, exchange-core/utils
- scroll-utils.ts — скролл-утилиты; потребители: FloatingExchangeButton.tsx
- store-factory.ts — фабрики стора (Zustand helpers); потребители: hooks/state/\*
- trpc-errors.ts — генерация tRPC ошибок; потребители: trpc/routers/\*
- validation/ — инфраструктура валидаторов
  - constants.ts, core.ts, field-validation.ts, handlers.ts, hooks.ts, schema-helpers.ts, single-field.ts
  - schemas/
    - basic.ts — базовые схемы (перенос из schemas-basic.ts)
  - schemas-basic.ts, schemas-composed.ts, schemas-crypto.ts, schemas-utils.ts
  - index.ts
- validation-helpers.ts, validation-schemas.ts — агрегаторы схем

### packages/hooks/src

- client-hooks.ts — SSR-safe экспорт клиентских сторах; потребитель: providers/theme-provider.tsx
- index.ts — публичные типы/хуки
- useExchangeStore.ts, useNotifications.ts, useTheme.ts, useUIStore.ts — публичные API
- ui/
  - index.ts, useScrollVisibility.ts — UI-утилиты
- business/
  - authMessages.ts, useExchange.ts, useFormTypes.ts, useFormWithNextIntl.ts, useMathCaptcha.ts, useOrderTracking.ts
- state/
  - exchange-constants.ts, exchange-fiat-actions.ts, exchange-helpers.ts, exchange-selectors.ts, exchange-store.ts, index.ts, notification-store.ts, trading-store.ts, ui-store.ts

### packages/exchange-core/src

- types/
  - auth.ts, contact.ts, currency.ts, fiat.ts, order.ts, transaction.ts, user.ts, index.ts — доменные типы
- data/
  - mock-data.ts, mock-factory.ts — генераторы и фикстуры
  - manager.ts — userManager/orderManager
  - index.ts — экспорт
- services/
  - crypto-address-generation.ts, id-generation.ts, index.ts
- utils/
  - access-validators.ts, business-validators.ts, calculations.ts, composite-validators.ts, crypto.ts, data-sanitizers.ts, order-validators.ts, type-guards.ts, validation.ts
- index.ts — корневой экспорт

### apps/web/src/server/trpc/routers

- auth.ts, exchange.ts, fiat.ts, operator.ts, shared.ts, support.ts
- user/
  - index.ts, orders.ts, profile.ts, security.ts

### apps/web/src/components

- app-footer.tsx, app-header.tsx, app-layout.tsx, auth-dialogs.tsx
- exchange-form/
  - ExchangeArrow.tsx, ExchangeBenefits.tsx, ReceivingCard.tsx, SendingCard.tsx, useHeroExchangeForm.ts
- ExchangeRates.tsx, FeaturesSection.tsx, FloatingExchangeButton.tsx, HeroExchangeForm.tsx, HeroSection.tsx, HowItWorksSection.tsx, OrderStatus.tsx, theme-toggle-i18n.tsx, index.ts
- forms/
  - AuthForms.tsx, ExchangeForm.tsx, LoginForm.tsx, RegisterForm.tsx, index.ts

### packages/providers/src

- index.tsx — реэкспорты
- theme-provider.tsx — ThemeProvider (потребляет hooks/client-hooks.useUIStore)
- theme-script.tsx — ThemeScript для инжекта темы на серверной разметке

### packages/ui/src

- components/
  - auth/
    - AuthCaptchaField.tsx, AuthConfirmPasswordField.tsx, AuthEmailField.tsx, AuthFormLayout.tsx, AuthPasswordField.tsx, AuthSubmitButton.tsx, AuthSwitchButton.tsx, index.ts
  - data-table/
    - DataTableBody.tsx, DataTableFilters.tsx, DataTableHeader.tsx, DataTablePagination.tsx
  - ui/
    - button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx, form.tsx, input.tsx, label.tsx, math-captcha.tsx, notification.tsx, select.tsx, spinner.tsx, table.tsx, textarea.tsx
  - admin-panel-compound.tsx, data-table-compound.tsx, exchange-form.tsx, floating-action-button.tsx, footer-compound.tsx, footer.tsx, header-compound.tsx, theme-toggle.tsx, tree-view.tsx, TreeNodeItem.tsx, index.ts
- hooks/ — (пусто)
- lib/ — header-helpers.tsx, header-types.ts, shared-styles.ts, useMathCaptchaLocal.ts, utils.ts
- styles/ — adaptive-container.css, globals.css
- stories/
  - Button.stories.tsx, Card.stories.tsx, DataTable.stories.tsx, Dialog.stories.tsx, DropdownMenu.stories.tsx, Form.stories.tsx, Input.stories.tsx, Label.stories.tsx, Notification.stories.tsx, Select.stories.tsx, Spinner.stories.tsx, Table.stories.tsx, Textarea.stories.tsx, TreeView.stories.tsx, design-tokens/
- types/ — auth-fields.ts, jest.d.ts
- **tests**/ — Button.test.tsx, DataTable.test.tsx

### apps/admin-panel

- Next.js приложение (структура app/). Статус: в разработке; подтверждение по ESLint ignores и задачам.
- Использует: @repo/providers (Providers/ThemeProvider), @repo/ui (компоненты), @repo/constants (константы UI)

### apps/docs

- Next.js приложение документации (app/). Используется для публичных страниц и справки.

---

## packages/constants

- src/
  - api.ts, auth.ts, banks.ts, business-limits.ts, business.ts, contacts.ts, currency-formats.ts, decimal-precision.ts, exchange-currencies.ts, exchange.ts, fiat-currencies.ts, linter-limits.ts, order-statuses.ts, percentage-calculations.ts, rate-limits.ts, time-constants.ts, ui.ts, user.ts, validation-bounds.ts, validation.ts, index.ts
- Роль: централизованные константы (включая ORDER_STATUSES, валидационные лимиты, UI численные константы). Потребители подтверждены во множестве пакетов и apps.

## packages/tailwind-preset

- globals.css — глобальные стили
- preset.js — общий пресет Tailwind (используется в apps/\*/tailwind.config)
- README.md

## packages/design-tokens

- colors.js, spacing.js, typography.js — токены дизайна (JS)
- components.js/tsx — демонстрация/примеры
- index.js/index.d.ts — входная точка

## packages/style-scanner

- src/
  - core/, scanners/, services/, utils/, config/, constants/, types/, index.ts
- Роль: инструменты сканирования стилей и документации (используется для отчётов и статического анализа в docs/style-docs)

## packages/eslint-config

- набор конфигов: base.js, next.js, react.js, testing.js, ui-library.js, performance-benchmark.js и т.д.; ignores.js — исключения (подтверждает apps/docs и apps/admin-panel статусы).

## packages/typescript-config

- base.json, nextjs.json, react-library.json — базовые tsconfig пресеты

---

## apps/web — структура приложения

- app/
  - layout.tsx, globals.css, error.tsx, loading.tsx, not-found.tsx, favicon.ico
  - [locale]/
    - layout.tsx, page.tsx, exchange/page.tsx, error.tsx, loading.tsx, not-found-page/page.tsx
- src/
  - components/ — описано выше
  - hooks/ — локальные хуки
  - i18n/ — navigation.ts, request.ts, routing.ts
  - server/
    - trpc/
      - init.ts, context.ts, index.ts
      - middleware/ — auth.ts, rateLimit.ts
      - routers/ — перечислены выше (включая user/\*)
    - utils/ — вспомогательные серверные утилиты
  - messages/ — локали en.json, ru.json

---

## scripts и tests

- scripts/
  - analyze-project-structure.ps1, bundle-analyzer.js, checklist-reminder.mjs, validate-cleanup.js — служебные скрипты
- tests/
  - admin-panel.spec.ts, docs.spec.ts, web.spec.ts — браузерные/интеграционные тесты (Playwright)

---

## apps/web — локальные хуки (src/hooks)

- index.ts, useAuthFormConfig.ts, useAuthMutationAdapter.ts, useAuthMutations.ts, useExchangeMutation.ts, useExchangeStoreWithTranslations.ts, useNotificationsWithTranslations.ts, usePasswordMutations.ts, useUIStoreWithTranslations.ts

## apps/docs — структура app/

- layout.tsx, globals.css, page.tsx, page.module.css, favicon.ico, fonts/

## apps/admin-panel — структура app/

- layout.tsx, globals.css, page.tsx, error.tsx, loading.tsx, not-found.tsx
