# Файлы кодовой базы для разработки

## TypeScript/JavaScript файлы разработки

### Приложения

#### Web App (apps/web)

- [x] a######## Design Tokens Package

- [x] packages/design-tokens/index.js
- [x] packages/design-tokens/colors.js
- [x] packages/design-tokens/components.js
- [x] packages/design-tokens/components.tsx
- [ ] packages/design-tokens/form-patterns.js Tokens Package

- [x] packages/design-tokens/index.js
- [x] packages/design-tokens/colors.js
- [ ] packages/design-tokens/components.jseb/middleware.ts
- [x] apps/web/lib/stores.ts
- [x] apps/web/pages/api/trpc/[trpc].ts
- [x] apps/web/lib/trpc-provider.tsx
- [x] apps/web/app/error.tsx
- [x] apps/web/app/layout.tsx
- [x] apps/web/app/loading.tsx
- [x] apps/web/app/not-found.tsx
- [x] apps/web/app/[locale]/error.tsx
- [x] apps/web/app/[locale]/layout.tsx
- [x] apps/web/app/[locale]/loading.tsx
- [x] apps/web/app/[locale]/page.tsx
- [x] apps/web/app/[locale]/exchange/page.tsx
- [x] apps/web/app/[locale]/not-found-page/page.tsx

#### Web App - Components

- [x] apps/web/src/components/index.ts
- [x] apps/web/src/components/app-footer.tsx
- [x] apps/web/src/components/app-header.tsx
- [x] apps/web/src/components/app-layout.tsx
- [x] apps/web/src/components/auth-dialogs.tsx
- [x] apps/web/src/components/ExchangeRates.tsx
- [x] apps/web/src/components/FeaturesSection.tsx
- [x] apps/web/src/components/FloatingExchangeButton.tsx
- [x] apps/web/src/components/HeroExchangeForm.tsx
- [x] apps/web/src/components/HeroSection.tsx
- [x] apps/web/src/components/HowItWorksSection.tsx
- [x] apps/web/src/components/OrderStatus.tsx
- [x] apps/web/src/components/theme-toggle-i18n.tsx

#### Web App - Exchange Form

- [x] apps/web/src/components/exchange-form/ExchangeArrow.tsx
- [x] apps/web/src/components/exchange-form/ExchangeBenefits.tsx
- [x] apps/web/src/components/exchange-form/ReceivingCard.tsx
- [x] apps/web/src/components/exchange-form/SendingCard.tsx
- [x] apps/web/src/components/exchange-form/useHeroExchangeForm.ts

#### Web App - Forms

- [x] apps/web/src/components/forms/index.ts
- [x] apps/web/src/components/forms/AuthForms.tsx
- [x] apps/web/src/components/forms/ExchangeForm.tsx
- [x] apps/web/src/components/forms/LoginForm.tsx
- [x] apps/web/src/components/forms/RegisterForm.tsx

#### Web App - Hooks

- [x] apps/web/src/hooks/index.ts
- [x] apps/web/src/hooks/useAuthFormConfig.ts
- [x] apps/web/src/hooks/useAuthMutationAdapter.ts
- [x] apps/web/src/hooks/useAuthMutations.ts
- [x] apps/web/src/hooks/useExchangeMutation.ts
- [x] apps/web/src/hooks/useExchangeStoreWithTranslations.ts
- [x] apps/web/src/hooks/useNotificationsWithTranslations.ts
- [x] apps/web/src/hooks/usePasswordMutations.ts
- [x] apps/web/src/hooks/useUIStoreWithTranslations.ts

#### Web App - i18n

- [x] apps/web/src/i18n/navigation.ts
- [x] apps/web/src/i18n/request.ts
- [x] apps/web/src/i18n/routing.ts

#### Web App - Server/tRPC

- [x] apps/web/src/server/trpc/context.ts
- [x] apps/web/src/server/trpc/index.ts
- [x] apps/web/src/server/trpc/init.ts
- [x] apps/web/src/server/trpc/middleware/auth.ts
- [x] apps/web/src/server/trpc/middleware/rateLimit.ts
- [x] apps/web/src/server/trpc/routers/index.ts
- [x] apps/web/src/server/trpc/routers/auth.ts
- [x] apps/web/src/server/trpc/routers/exchange.ts
- [x] apps/web/src/server/trpc/routers/fiat.ts
- [x] apps/web/src/server/trpc/routers/operator.ts
- [x] apps/web/src/server/trpc/routers/shared.ts
- [x] apps/web/src/server/trpc/routers/support.ts
- [x] apps/web/src/server/trpc/routers/user/index.ts
- [x] apps/web/src/server/trpc/routers/user/orders.ts
- [x] apps/web/src/server/trpc/routers/user/profile.ts
- [x] apps/web/src/server/trpc/routers/user/security.ts

#### Web App - Server Utils

- [x] apps/web/src/server/utils/delay.ts
- [x] apps/web/src/server/utils/i18n-errors.ts

#### Admin Panel (apps/admin-panel)

- [x] apps/admin-panel/app/error.tsx
- [x] apps/admin-panel/app/layout.tsx
- [x] apps/admin-panel/app/loading.tsx
- [x] apps/admin-panel/app/not-found.tsx
- [x] apps/admin-panel/app/page.tsx

#### Docs App (apps/docs)

- [x] apps/docs/app/layout.tsx
- [x] apps/docs/app/page.tsx

### Пакеты (packages/)

#### Constants Package

- [x] packages/constants/src/index.ts
- [x] packages/constants/src/api.ts
- [x] packages/constants/src/auth.ts
- [x] packages/constants/src/banks.ts
- [x] packages/constants/src/business-limits.ts
- [x] packages/constants/src/business.ts
- [x] packages/constants/src/contacts.ts
- [x] packages/constants/src/currency-formats.ts
- [x] packages/constants/src/decimal-precision.ts
- [x] packages/constants/src/exchange-currencies.ts
- [x] packages/constants/src/exchange.ts
- [x] packages/constants/src/fiat-currencies.ts
- [x] packages/constants/src/linter-limits.ts
- [x] packages/constants/src/order-statuses.ts
- [x] packages/constants/src/percentage-calculations.ts
- [x] packages/constants/src/rate-limits.ts
- [x] packages/constants/src/time-constants.ts
- [x] packages/constants/src/ui.ts
- [x] packages/constants/src/user.ts
- [x] packages/constants/src/validation-bounds.ts
- [x] packages/constants/src/validation.ts

#### Design Tokens Package

- [x] packages/design-tokens/index.js
- [x] packages/design-tokens/colors.js
- [x] packages/design-tokens/components.js
- [x] packages/design-tokens/components.tsx
- [x] packages/design-tokens/form-patterns.js
- [x] packages/design-tokens/spacing.js
- [x] packages/design-tokens/typography.js
- [x] packages/design-tokens/index.d.ts

#### ESLint Config Package

- [x] packages/eslint-config/api.js
- [x] packages/eslint-config/base.js
- [x] packages/eslint-config/configs.js
- [x] packages/eslint-config/ignores.js
- [x] packages/eslint-config/lazy-loading.js
- [x] packages/eslint-config/next.js
- [x] packages/eslint-config/performance-benchmark.js
- [x] packages/eslint-config/react-internal.js
- [x] packages/eslint-config/react.js
- [x] packages/eslint-config/shared-rules.js
- [x] packages/eslint-config/testing.js
- [x] packages/eslint-config/ui-library.js
- [x] packages/eslint-config/utils.js

#### Exchange Core Package

- [x] packages/exchange-core/src/index.ts
- [x] packages/exchange-core/src/data/index.ts
- [x] packages/exchange-core/src/data/manager.ts
- [x] packages/exchange-core/src/data/mock-data.ts
- [x] packages/exchange-core/src/data/mock-factory.ts
- [x] packages/exchange-core/src/services/index.ts
- [x] packages/exchange-core/src/services/crypto-address-generation.ts
- [x] packages/exchange-core/src/services/id-generation.ts
- [x] packages/exchange-core/src/types/index.ts
- [x] packages/exchange-core/src/types/auth.ts
- [x] packages/exchange-core/src/types/contact.ts
- [x] packages/exchange-core/src/types/currency.ts
- [x] packages/exchange-core/src/types/fiat.ts
- [x] packages/exchange-core/src/types/order.ts
- [x] packages/exchange-core/src/types/transaction.ts
- [x] packages/exchange-core/src/types/user.ts
- [x] packages/exchange-core/src/utils/access-validators.ts
- [x] packages/exchange-core/src/utils/business-validators.ts
- [x] packages/exchange-core/src/utils/calculations.ts
- [x] packages/exchange-core/src/utils/composite-validators.ts
- [x] packages/exchange-core/src/utils/crypto.ts
- [x] packages/exchange-core/src/utils/data-sanitizers.ts
- [x] packages/exchange-core/src/utils/order-validators.ts
- [x] packages/exchange-core/src/utils/type-guards.ts
- [x] packages/exchange-core/src/utils/validation.ts

#### Hooks Package

- [x] packages/hooks/src/index.ts
- [x] packages/hooks/src/client-hooks.ts
- [x] packages/hooks/src/useExchangeStore.ts
- [x] packages/hooks/src/useNotifications.ts
- [x] packages/hooks/src/useTheme.ts
- [x] packages/hooks/src/useUIStore.ts
- [x] packages/hooks/src/business/authMessages.ts
- [x] packages/hooks/src/business/useAuth.ts
- [x] packages/hooks/src/business/useExchange.ts
- [x] packages/hooks/src/business/useForm.ts
- [x] packages/hooks/src/business/useFormTypes.ts
- [x] packages/hooks/src/business/useFormWithNextIntl.ts
- [x] packages/hooks/src/business/useMathCaptcha.ts
- [x] packages/hooks/src/business/useOrderTracking.ts
- [x] packages/hooks/src/state/index.ts
- [x] packages/hooks/src/state/exchange-constants.ts
- [x] packages/hooks/src/state/exchange-fiat-actions.ts
- [x] packages/hooks/src/state/exchange-helpers.ts
- [x] packages/hooks/src/state/exchange-selectors.ts
- [x] packages/hooks/src/state/exchange-store.ts
- [x] packages/hooks/src/state/notification-store.ts
- [x] packages/hooks/src/state/trading-store.ts
- [x] packages/hooks/src/state/ui-store.ts
- [x] packages/hooks/src/ui/index.ts
- [x] packages/hooks/src/ui/useScrollVisibility.ts

#### Providers Package

- [x] packages/providers/src/index.tsx
- [x] theme-provider.tsx
- [x] theme-script.tsx

#### Tailwind Preset Package

- [x] preset.js

#### UI Package

- [x] packages/ui/src/index.ts
- [x] packages/ui/src/button.tsx
- [x] packages/ui/src/card.tsx
- [x] packages/ui/src/code.tsx
- [x] packages/ui/src/components/index.ts
- [x] packages/ui/src/components/adaptive-container.tsx
- [x] packages/ui/src/components/admin-panel-compound.tsx
- [x] packages/ui/src/components/data-table-compound.tsx
- [x] packages/ui/src/components/exchange-form.tsx
- [x] packages/ui/src/components/floating-action-button.tsx
- [x] packages/ui/src/components/footer-compound.tsx
- [x] packages/ui/src/components/footer.tsx
- [x] packages/ui/src/components/header-compound.tsx
- [x] packages/ui/src/components/theme-toggle.tsx
- [x] packages/ui/src/components/tree-view.tsx
- [x] packages/ui/src/components/TreeNodeItem.tsx

#### UI Package - Auth Components

- [x] packages/ui/src/components/auth/index.ts
- [x] packages/ui/src/components/auth/AuthCaptchaField.tsx
- [x] packages/ui/src/components/auth/AuthConfirmPasswordField.tsx
- [x] packages/ui/src/components/auth/AuthEmailField.tsx
- [x] packages/ui/src/components/auth/AuthFormLayout.tsx
- [x] packages/ui/src/components/auth/AuthPasswordField.tsx
- [x] packages/ui/src/components/auth/AuthSubmitButton.tsx
- [x] packages/ui/src/components/auth/AuthSwitchButton.tsx

#### UI Package - Data Table Components

- [x] packages/ui/src/components/data-table/DataTableBody.tsx
- [x] packages/ui/src/components/data-table/DataTableFilters.tsx
- [x] packages/ui/src/components/data-table/DataTableHeader.tsx
- [x] packages/ui/src/components/data-table/DataTablePagination.tsx

#### UI Package - Base UI Components

- [x] packages/ui/src/components/ui/button.tsx
- [x] packages/ui/src/components/ui/card.tsx
- [x] packages/ui/src/components/ui/dialog.tsx
- [x] packages/ui/src/components/ui/dropdown-menu.tsx
- [x] packages/ui/src/components/ui/form.tsx
- [x] packages/ui/src/components/ui/input.tsx
- [x] packages/ui/src/components/ui/label.tsx
- [x] packages/ui/src/components/ui/math-captcha.tsx
- [x] packages/ui/src/components/ui/notification.tsx
- [x] packages/ui/src/components/ui/select.tsx
- [x] packages/ui/src/components/ui/spinner.tsx
- [x] packages/ui/src/components/ui/table.tsx
- [x] packages/ui/src/components/ui/textarea.tsx

#### UI Package - Lib & Utils

- [x] packages/ui/src/lib/header-helpers.tsx
- [x] packages/ui/src/lib/header-types.ts
- [x] packages/ui/src/lib/shared-styles.ts
- [x] packages/ui/src/lib/useMathCaptchaLocal.ts
- [x] packages/ui/src/lib/utils.ts
- [x] packages/ui/src/types/auth-fields.ts
- [x] packages/ui/turbo/generators/config.ts

#### Utils Package

- [x] packages/utils/src/index.ts
- [x] packages/utils/src/calculations.ts
- [x] packages/utils/src/env.ts
- [x] packages/utils/src/formatting.ts
- [x] packages/utils/src/input-validation.ts
- [x] packages/utils/src/next-intl-validation.ts
- [x] packages/utils/src/order-status.ts
- [x] packages/utils/src/order-utils.ts
- [x] packages/utils/src/scroll-utils.ts
- [x] packages/utils/src/store-factory.ts
- [x] packages/utils/src/trpc-errors.ts
- [x] packages/utils/src/validation-helpers.ts
- [x] packages/utils/src/validation-schemas.ts

#### Utils Package - Validation

- [x] packages/utils/src/validation/index.ts
- [x] packages/utils/src/validation/constants.ts
- [x] packages/utils/src/validation/core.ts
- [x] packages/utils/src/validation/field-validation.ts
- [x] packages/utils/src/validation/handlers.ts
- [x] packages/utils/src/validation/hooks.ts
- [x] packages/utils/src/validation/schema-helpers.ts
- [x] packages/utils/src/validation/schemas-basic.ts
- [x] packages/utils/src/validation/schemas-composed.ts
- [x] packages/utils/src/validation/schemas-crypto.ts
- [x] packages/utils/src/validation/schemas-utils.ts
- [x] packages/utils/src/validation/single-field.ts
- [x] packages/utils/src/validation/schemas/basic.ts

### Конфигурационные файлы разработки

#### Build & Development Config

- [x] packages/constants/tsup.config.ts

---

**Всего файлов для разработки: 284**

**Исключены:**

- Storybook файлы (stories, static builds)
- Тесты (.test.tsx, .spec.ts)
- Документация (.md файлы)
- Статические ресурсы (шрифты, картинки)
- Конфигурационные файлы (next.config.js, jest.config.js)
- Git hooks и служебные файлы
