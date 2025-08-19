# File Tree: exchanger-front

Generated on: 8/19/2025, 12:08:36 AM
Root path: `e:\project\kiro\exchanger-front`

## 📝 Описание структуры проекта

Каждый элемент структуры описан в формате: **Роль в архитектуре** | **Технологии/Назначение** | **Когда использовать**

```
├── 📁 apps/ - Готовые к деплою приложения | Next.js App Router | Основные пользовательские интерфейсы системы
│   ├── 📁 admin-panel/ - Административная панель | Next.js 15, App Router | Управление системой, операторские функции
│   │   ├── 📁 .next/ 🚫 (auto-hidden) - Build артефакты Next.js | Генерируемые файлы | Автоматически создается при сборке
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок в монорепо
│   │   ├── 📁 app/ - Next.js App Router структура | Маршруты и layouts | Основная структура админ-панели
│   │   │   ├── 📄 error.tsx - Глобальный обработчик ошибок | React Error Boundary | Fallback UI при ошибках приложения
│   │   │   ├── 🎨 globals.css - Глобальные стили админки | CSS, Tailwind imports | Базовые стили и CSS переменные
│   │   │   ├── 📄 layout.tsx - Корневой layout компонент | React Server Component | Общая структура всех страниц админки
│   │   │   ├── 📄 loading.tsx - UI состояния загрузки | React Suspense fallback | Показ индикаторов загрузки
│   │   │   ├── 📄 not-found.tsx - Страница 404 ошибки | React компонент | Обработка несуществующих маршрутов
│   │   │   └── 📄 page.tsx - Главная страница админки | React Server Component | Dashboard и основной интерфейс
│   │   ├── 📄 next-env.d.ts - TypeScript конфигурация Next.js | Автогенерируемые типы | Подключение типов Next.js к TS
│   │   ├── 📄 next.config.mjs - Конфигурация Next.js | Build settings, routes | Настройка поведения приложения
│   │   ├── 📄 package.json - Манифест NPM пакета | Зависимости, scripts | Локальные зависимости админ-панели
│   │   ├── 📄 tailwind.config.cjs - Конфигурация Tailwind CSS | Стили, themes | Кастомизация UI системы админки
│   │   └── 📄 tsconfig.json - Конфигурация TypeScript | Компиляция, paths | Настройки типизации админ-панели
│   ├── 📁 docs/ - Документационный сайт | Next.js 15, App Router | Публичная документация проекта
│   │   ├── 📁 .next/ 🚫 (auto-hidden) - Build артефакты Next.js | Генерируемые файлы | Автоматически создается при сборке
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок в монорепо
│   │   ├── 📁 app/ - Next.js App Router структура | Маршруты и layouts | Основная структура сайта документации
│   │   │   ├── 📁 fonts/ - Веб-шрифты | Geist шрифты | Типографика документационного сайта
│   │   │   │   ├── 📄 GeistMonoVF.woff - Моноширинный шрифт | Variable Font | Код и примеры в документации
│   │   │   │   └── 📄 GeistVF.woff - Основной шрифт | Variable Font | Основной текст документации
│   │   │   ├── 🖼️ favicon.ico - Иконка сайта | ICO формат | Favicon для браузера
│   │   │   ├── 🎨 globals.css - Глобальные стили | CSS, Tailwind imports | Базовые стили документационного сайта
│   │   │   ├── 📄 layout.tsx - Корневой layout | React Server Component | Общая структура страниц документации
│   │   │   ├── 🎨 page.module.css - CSS модули | Локальные стили | Стили для главной страницы документации
│   │   │   └── 📄 page.tsx - Главная страница | React Server Component | Landing page документационного сайта
│   │   ├── 📁 public/ - Статические ресурсы | SVG иконки, images | Публичные файлы документационного сайта
│   │   │   ├── 🖼️ file-text.svg - Иконка документа | SVG | UI элементы документации
│   │   │   ├── 🖼️ globe.svg - Иконка глобуса | SVG | Интернационализация, сеть
│   │   │   ├── 🖼️ next.svg - Логотип Next.js | SVG | Брендинг технологий
│   │   │   ├── 🖼️ turborepo-dark.svg - Логотип Turborepo темный | SVG | Брендинг для темной темы
│   │   │   ├── 🖼️ turborepo-light.svg - Логотип Turborepo светлый | SVG | Брендинг для светлой темы
│   │   │   ├── 🖼️ vercel.svg - Логотип Vercel | SVG | Брендинг платформы деплоя
│   │   │   └── 🖼️ window.svg - Иконка окна | SVG | UI элементы интерфейса
│   │   ├── 🚫 .gitignore - Игнорируемые Git файлы | Git конфигурация | Исключения из версионирования
│   │   ├── 📖 README.md - Документация пакета | Markdown | Инструкции по документационному сайту
│   │   ├── 📄 next-env.d.ts - TypeScript конфигурация Next.js | Автогенерируемые типы | Подключение типов Next.js к TS
│   │   ├── 📄 next.config.js - Конфигурация Next.js | Build settings | Настройка поведения сайта документации
│   │   ├── 📄 package.json - Манифест NPM пакета | Зависимости, scripts | Локальные зависимости сайта документации
│   │   ├── 📄 tailwind.config.cjs - Конфигурация Tailwind CSS | Стили, themes | Кастомизация UI системы документации
│   │   └── 📄 tsconfig.json - Конфигурация TypeScript | Компиляция, paths | Настройки типизации документационного сайта
│   └── 📁 web/ - Основное приложение ExchangeGO | Next.js 15, tRPC, i18n | Главный пользовательский интерфейс обменника
│       ├── 📁 .next/ 🚫 (auto-hidden) - Build артефакты Next.js | Генерируемые файлы | Автоматически создается при сборке
│       ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок в монорепо
│       ├── 📁 app/ - Next.js App Router структура | Маршруты и layouts | Основная структура веб-приложения
│       │   ├── 📁 [locale]/ - Интернационализация маршрутов | next-intl routing | Поддержка мультиязычности (en/ru)
│       │   │   ├── 📁 exchange/ - Страница обмена валют | Business logic | Основной функционал обменника
│       │   │   │   └── 📄 page.tsx - Страница процесса обмена | React Server Component | UI для создания и отслеживания обменов
│       │   │   ├── 📁 not-found-page/ - Кастомная 404 страница | Error handling | Обработка несуществующих маршрутов
│       │   │   │   └── 📄 page.tsx - 404 страница с локализацией | React Server Component | Локализованная страница ошибки
│       │   │   ├── 📄 error.tsx - Обработчик ошибок для locale | React Error Boundary | Fallback UI при ошибках локализации
│       │   │   ├── 📄 layout.tsx - Layout для локализованных страниц | React Server Component | Общая структура с поддержкой i18n
│       │   │   ├── 📄 loading.tsx - UI загрузки для locale | React Suspense fallback | Индикаторы загрузки локализованных страниц
│       │   │   └── 📄 page.tsx - Главная страница (локализованная) | React Server Component | Landing page с формой обмена
│       │   ├── 📁 fonts/ - Веб-шрифты приложения | Geist шрифты | Типографика основного приложения
│       │   │   ├── 📄 GeistMonoVF.woff - Моноширинный шрифт | Variable Font | Числовые данные, коды
│       │   │   └── 📄 GeistVF.woff - Основной шрифт | Variable Font | Основной текст интерфейса
│       │   ├── 📄 error.tsx - Глобальный обработчик ошибок | React Error Boundary | Fallback UI при критических ошибках
│       │   ├── 🖼️ favicon.ico - Иконка приложения | ICO формат | Favicon для основного приложения
│       │   ├── 🎨 globals.css - Глобальные стили | CSS, Tailwind imports | Базовые стили и CSS переменные
│       │   ├── 📄 layout.tsx - Корневой layout | React Server Component | Общая структура всех страниц приложения
│       │   ├── 📄 loading.tsx - Глобальный UI загрузки | React Suspense fallback | Индикаторы загрузки страниц
│       │   └── 📄 not-found.tsx - Глобальная 404 страница | React компонент | Обработка несуществующих маршрутов
│       ├── 📁 lib/ - Библиотеки и провайдеры | React providers | Конфигурация клиентских библиотек
│       │   └── 📄 trpc-provider.tsx - tRPC клиентский провайдер | React Context | Подключение tRPC к React приложению
│       ├── 📁 messages/ - Файлы локализации | next-intl словари | Переводы интерфейса на разные языки
│       │   ├── 📄 en.json - Английские переводы | JSON словарь | Все текстовые элементы на английском
│       │   └── 📄 ru.json - Русские переводы | JSON словарь | Все текстовые элементы на русском
│       ├── 📁 pages/ - Pages Router (совместимость) | Legacy API routes | API endpoints для совместимости
│       │   └── 📁 api/ - API маршруты | Server-side endpoints | Серверные точки подключения
│       │       └── 📁 trpc/ - tRPC API handler | Type-safe API | Обработчик tRPC запросов
│       │           └── 📄 [trpc].ts - Динамический tRPC router | Catch-all route | Маршрутизатор всех tRPC вызовов
│       ├── 📁 public/ - Статические ресурсы | SVG иконки, images | Публичные файлы веб-приложения
│       │   ├── 🖼️ file-text.svg - Иконка документа | SVG | UI элементы интерфейса
│       │   ├── 🖼️ globe.svg - Иконка глобуса | SVG | Интернационализация, сеть
│       │   ├── 🖼️ next.svg - Логотип Next.js | SVG | Брендинг технологий
│       │   ├── 🖼️ turborepo-dark.svg - Логотип Turborepo темный | SVG | Брендинг для темной темы
│       │   ├── 🖼️ turborepo-light.svg - Логотип Turborepo светлый | SVG | Брендинг для светлой темы
│       │   ├── 🖼️ vercel.svg - Логотип Vercel | SVG | Брендинг платформы деплоя
│       │   └── 🖼️ window.svg - Иконка окна | SVG | UI элементы интерфейса
│       ├── 📁 src/ - Исходный код приложения | React компоненты, hooks, server | Основная логика веб-приложения
│       │   ├── 📁 components/ - React компоненты | UI components, business logic | Переиспользуемые компоненты интерфейса
│       │   │   ├── 📁 exchange-form/ - Компоненты формы обмена | Exchange UI logic | Элементы главной формы обменника
│       │   │   │   ├── 📄 ExchangeArrow.tsx - Стрелка между валютами | UI компонент | Визуальный элемент направления обмена
│       │   │   │   ├── 📄 ExchangeBenefits.tsx - Преимущества обменника | Marketing компонент | Блок с выгодами использования сервиса
│       │   │   │   ├── 📄 ReceivingCard.tsx - Карточка получения валюты | Exchange UI | Выбор валюты и суммы получения
│       │   │   │   ├── 📄 SendingCard.tsx - Карточка отправки валюты | Exchange UI | Выбор валюты и суммы отправки
│       │   │   │   └── 📄 useHeroExchangeForm.ts - Хук формы обмена | Business logic hook | Логика управления состоянием формы
│       │   │   ├── 📁 forms/ - Компоненты форм | Form components | Переиспользуемые формы приложения
│       │   │   │   ├── 📄 AuthForms.tsx - Формы авторизации | Auth UI | Контейнер для форм входа и регистрации
│       │   │   │   ├── 📄 ExchangeForm.tsx - Главная форма обмена | Business component | Основная форма создания обмена
│       │   │   │   ├── 📄 LoginForm.tsx - Форма входа | Auth component | Форма авторизации пользователя
│       │   │   │   ├── 📄 RegisterForm.tsx - Форма регистрации | Auth component | Форма создания нового аккаунта
│       │   │   │   └── 📄 index.ts - Экспорты форм | Module exports | Централизованный экспорт всех форм
│       │   │   ├── 📄 ErrorBoundaryTest.tsx - Тестовый компонент ошибок | Development tool | Тестирование Error Boundary в dev режиме
│       │   │   ├── 📄 ExchangeRates.tsx - Отображение курсов валют | Business component | Показ актуальных курсов обмена
│       │   │   ├── 📄 FeaturesSection.tsx - Секция возможностей | Marketing component | Блок с основными функциями сервиса
│       │   │   ├── 📄 FloatingExchangeButton.tsx - Плавающая кнопка обмена | UI component | Кнопка быстрого доступа к обмену
│       │   │   ├── 📄 HeroExchangeForm.tsx - Главная форма на лендинге | Landing component | Основная форма на главной странице
│       │   │   ├── 📄 HeroSection.tsx - Главная секция лендинга | Landing component | Hero блок с заголовком и CTA
│       │   │   ├── 📄 HowItWorksSection.tsx - Секция "Как это работает" | Info component | Инструкции по использованию сервиса
│       │   │   ├── 📄 OrderStatus.tsx - Статус заказа | Business component | Отображение состояния обмена
│       │   │   ├── 📄 app-footer.tsx - Подвал приложения | Layout component | Нижняя часть сайта с ссылками
│       │   │   ├── 📄 app-header.tsx - Шапка приложения | Layout component | Верхняя навигация и меню
│       │   │   ├── 📄 app-layout.tsx - Layout приложения | Layout component | Общая структура страниц
│       │   │   ├── 📄 auth-dialogs.tsx - Диалоги авторизации | Auth component | Модальные окна входа и регистрации
│       │   │   ├── 📄 index.ts - Экспорты компонентов | Module exports | Централизованный экспорт всех компонентов
│       │   │   └── 📄 theme-toggle-i18n.tsx - Переключатель темы и языка | UI component | Контролы темы и интернационализации
│       │   ├── 📁 hooks/ - Custom React hooks | State management | Логика состояния и бизнес-правил приложения
│       │   │   ├── 📄 index.ts - Экспорты hooks | Module exports | Централизованный экспорт всех хуков
│       │   │   ├── 📄 useAuthFormConfig.ts - Конфигурация форм авторизации | Auth logic | Настройки и валидация форм входа/регистрации
│       │   │   ├── 📄 useAuthMutationAdapter.ts - Адаптер мутаций авторизации | Auth adapter | Преобразование API calls в UI состояния
│       │   │   ├── 📄 useAuthMutations.ts - Мутации авторизации | Auth API hooks | tRPC мутации для входа/регистрации
│       │   │   ├── 📄 useExchangeMutation.ts - Мутации обмена | Exchange API hooks | tRPC мутации для создания обменов
│       │   │   ├── 📄 useExchangeStoreWithTranslations.ts - Стор обмена с переводами | State + i18n | Локализованное состояние формы обмена
│       │   │   ├── 📄 useNotificationsWithTranslations.ts - Уведомления с переводами | Notifications + i18n | Локализованные системные сообщения
│       │   │   ├── 📄 usePasswordMutations.ts - Мутации паролей | Password API hooks | tRPC мутации для работы с паролями
│       │   │   └── 📄 useUIStoreWithTranslations.ts - UI стор с переводами | UI state + i18n | Локализованное состояние интерфейса
│       │   ├── 📁 i18n/ - Интернационализация | next-intl конфигурация | Настройка мультиязычности приложения
│       │   │   ├── 📄 navigation.ts - Навигация с i18n | next-intl routing | Локализованная маршрутизация
│       │   │   ├── 📄 request.ts - Обработка запросов i18n | Server-side i18n | Серверная локализация
│       │   │   └── 📄 routing.ts - Маршрутизация i18n | next-intl config | Конфигурация локализованных маршрутов
│       │   └── 📁 server/ - Серверная логика | tRPC API, middleware | Backend функциональность приложения
│       │       ├── 📁 trpc/ - tRPC конфигурация | Type-safe API layer | Типизированный API между клиентом и сервером
│       │       │   ├── 📁 middleware/ - tRPC middleware | Authentication, rate limiting | Промежуточные обработчики запросов
│       │       │   │   ├── 📄 auth.ts - Middleware авторизации | JWT verification | Проверка токенов и прав доступа
│       │       │   │   └── 📄 rateLimit.ts - Middleware лимитов | Request throttling | Ограничение частоты запросов
│       │       │   ├── 📁 routers/ - tRPC роутеры | API endpoints | Группы API endpoint'ов по функциональности
│       │       │   │   ├── 📁 user/ - Пользовательские роутеры | User management API | API для работы с пользователями
│       │       │   │   │   ├── 📄 index.ts - Главный роутер пользователей | User router exports | Объединение всех пользовательских роутеров
│       │       │   │   │   ├── 📄 orders.ts - Роутер заказов | Order management | API для работы с заказами пользователя
│       │       │   │   │   ├── 📄 profile.ts - Роутер профиля | Profile management | API для управления профилем пользователя
│       │       │   │   │   └── 📄 security.ts - Роутер безопасности | Security settings | API для настроек безопасности аккаунта
│       │       │   │   ├── 📄 auth.ts - Роутер авторизации | Authentication API | API для входа, регистрации, токенов
│       │       │   │   ├── 📄 exchange.ts - Роутер обменов | Exchange business logic | API для создания и управления обменами
│       │       │   │   ├── 📄 fiat.ts - Роутер фиатных валют | Fiat currency API | API для работы с фиатными валютами и банками
│       │       │   │   ├── 📄 index.ts - Главный роутер | Router composition | Объединение всех роутеров в единый API
│       │       │   │   ├── 📄 operator.ts - Роутер оператора | Admin operations | API для операторских функций
│       │       │   │   ├── 📄 shared.ts - Общий роутер | Common endpoints | API для общих функций (курсы, справочники)
│       │       │   │   └── 📄 support.ts - Роутер поддержки | Support system | API для системы поддержки и тикетов
│       │       │   ├── 📄 context.ts - tRPC контекст | Request context | Создание контекста для каждого запроса
│       │       │   ├── 📄 index.ts - tRPC экспорты | Main tRPC exports | Основные экспорты tRPC конфигурации
│       │       │   └── 📄 init.ts - Инициализация tRPC | tRPC setup | Начальная настройка tRPC сервера
│       │       └── 📁 utils/ - Серверные утилиты | Helper functions | Вспомогательные функции для сервера
│       │           ├── 📄 delay.ts - Утилита задержек | Async delays | Функции для создания задержек в async операциях
│       │           └── 📄 i18n-errors.ts - Ошибки с локализацией | Localized errors | Локализованные сообщения об ошибках
│       ├── 🚫 .gitignore - Игнорируемые Git файлы | Git конфигурация | Исключения из версионирования
│       ├── 📖 README.md - Документация приложения | Markdown | Инструкции по основному приложению
│       ├── 📄 middleware.ts - Next.js middleware | Request interception | Обработка запросов до роутинга
│       ├── 📄 next-env.d.ts - TypeScript конфигурация Next.js | Автогенерируемые типы | Подключение типов Next.js к TS
│       ├── 📄 next.config.js - Конфигурация Next.js | Build settings, i18n | Настройка поведения основного приложения
│       ├── 📄 package.json - Манифест NPM пакета | Зависимости, scripts | Локальные зависимости веб-приложения
│       ├── 📄 tailwind.config.cjs - Конфигурация Tailwind CSS | Стили, themes | Кастомизация UI системы приложения
│       └── 📄 tsconfig.json - Конфигурация TypeScript | Компиляция, paths | Настройки типизации веб-приложения
├── 📁 docs/ - Проектная документация | Markdown files, guides | Техническая документация и руководства разработчика
│   ├── 📁 ai-agent/ - Документация AI агента | Agent rules | Правила и конфигурация для AI помощника
│   │   └── ⚙️ ai-agent-rules.yml - Правила для AI агента | YAML конфигурация | Законы и триггеры для AI ассистента
│   ├── 📁 tasks/ - Документация задач | Task management | Описание задач и их выполнения
│   ├── 📁 troubleshooting/ - Руководства по устранению проблем | Problem solving guides | Решения типовых проблем разработки
│   │   ├── 📝 AI_AGENT_PROBLEMS.md - Проблемы AI агента | AI troubleshooting | Типовые проблемы работы с AI ассистентом
│   │   ├── 📝 I18N_TROUBLESHOOTING.md - Проблемы интернационализации | i18n debugging | Решение проблем локализации
│   │   ├── 📝 MODULE_RESOLUTION_TROUBLESHOOTING.md - Проблемы резолюции модулей | Import/export issues | Решение проблем с импортами
│   │   └── 📝 SECURITY_WARNINGS_GUIDE.md - Руководство по предупреждениям безопасности | Security guidelines | Работа с уязвимостями
│   ├── 📝 API_DOCS.md - Документация API | API reference | Описание всех API endpoints и методов
│   ├── 📝 ARCHITECTURE.md - Архитектурное руководство | System design | Общая архитектура проекта и принципы
│   ├── 📝 BUNDLE_SIZE_INVESTIGATION_REPORT.md - Отчет анализа размера бандла | Performance report | Исследование размера сборки приложения
│   ├── 📝 CENTRALIZED_ESLINT_ARCHITECTURE.md - Архитектура централизованного ESLint | Code quality | Единая система линтинга в монорепо
│   ├── 📝 CLAUDE.md - Документация работы с Claude | AI assistant guide | Руководство по работе с AI ассистентом Claude
│   ├── 📝 CODE_REVIEW_PROTOCOLS.md - Протоколы код-ревью | Review guidelines | Процессы и стандарты проверки кода
│   ├── 📝 CODE_STYLE_GUIDE.md - Руководство по стилю кода | Style guidelines | Стандарты написания и оформления кода
│   ├── 📝 COMPOUND_COMPONENTS_MIGRATION_GUIDE.md - Руководство миграции компонентов | Component patterns | Переход к составным компонентам
│   ├── 📄 CONSTANTS_EXAMPLES.ts - Примеры констант | TypeScript examples | Образцы использования констант проекта
│   ├── 📝 DEVELOPER_GUIDE.md - Руководство разработчика | Development guide | Полное руководство по разработке в проекте
│   ├── 📝 EXHAUSTIVE_VERIFICATION_PROTOCOL.md - Протокол исчерпывающей проверки | Testing protocol | Комплексная проверка изменений
│   ├── 📝 FORM_DESIGN_PATTERNS.md - Паттерны дизайна форм | Form guidelines | Стандарты проектирования форм
│   ├── 📝 I18N_VALIDATION_ARCHITECTURE_REPORT.md - Отчет архитектуры валидации i18n | i18n validation | Система валидации с интернационализацией
│   ├── 📝 MOBILE_ADAPTATION_GUIDELINES.md - Руководство адаптации под мобильные | Mobile guidelines | Стандарты мобильной версии
│   ├── 📝 MODAL_AUTH_FILES_ANALYSIS.md - Анализ файлов модальной авторизации | Auth analysis | Разбор системы модальных окон авторизации
│   ├── 📝 NPM_COMMANDS_GUIDE.md - Руководство NPM команд | CLI guide | Описание всех доступных команд разработки
│   ├── 📝 PRE_COMMIT_GUIDE.md - Руководство pre-commit хуков | Git hooks | Настройка и использование pre-commit проверок
│   ├── 📝 PROJECT_CODEBASE_CATALOG.md - Каталог кодовой базы | Project structure | Подробное описание структуры проекта
│   ├── 📖 README.md - Главная документация | Project overview | Обзор проекта и быстрый старт
│   ├── 📝 ROLES_ARCHITECTURE.md - Архитектура ролей | Access control | Система прав доступа и ролей пользователей
│   ├── 📝 RPD.md - Руководство пользователя | User manual | Документация для конечных пользователей
│   ├── 📝 SECURITY_ENHANCED_VALIDATION_GUIDE.md - Руководство усиленной валидации | Security validation | Безопасная валидация данных
│   ├── 📝 SEMANTIC_DESIGN_SYSTEM.md - Семантическая система дизайна | Design system | Принципы и компоненты дизайн-системы
│   ├── 📝 STORYBOOK_GUIDELINES.md - Руководство Storybook | Component documentation | Стандарты документирования компонентов
│   ├── 📝 TASK_IMPLEMENTATION_GUIDE.md - Руководство реализации задач | Development workflow | Процесс выполнения задач разработки
│   ├── 📝 UNIVERSAL_AUDIT_SYSTEM.md - Универсальная система аудита | Code audit | Система проверки и аудита кода
│   ├── 📝 VALIDATION_ARCHITECTURE_GUIDE.md - Руководство архитектуры валидации | Validation patterns | Архитектура системы валидации
│   ├── 📝 VALIDATION_LOCALIZATION_GUIDE.md - Руководство локализации валидации | i18n validation | Интернационализация сообщений валидации
│   ├── 📄 codeviz-diagram-2025-07-03T11-57-13.drawio - Диаграмма архитектуры | DrawIO file | Визуальная схема архитектуры проекта
│   └── 📝 exchanger_AC.md - Техническое задание обменника | Requirements | Функциональные требования к системе
├── 📁 packages/ - Переиспользуемые пакеты | Shared libraries | Централизованные библиотеки для всех приложений
│   ├── 📁 constants/ - Бизнес-константы и конфигурация | TypeScript exports | Единый источник истины для всех констант системы
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок пакета
│   │   ├── 📁 dist/ 🚫 (auto-hidden) - Скомпилированные файлы | Build output | Результат сборки пакета констант
│   │   ├── 📁 node_modules/ 🚫 (auto-hidden) - Локальные зависимости | NPM packages | Зависимости пакета констант
│   │   ├── 📁 src/ - Исходный код констант | TypeScript files | Все константы системы по категориям
│   │   │   ├── 📄 api.ts - API константы | Endpoints, status codes | URL endpoints и HTTP статусы
│   │   │   ├── 📄 auth.ts - Константы авторизации | Auth settings | Настройки системы авторизации
│   │   │   ├── 📄 banks.ts - Банковские данные | Bank configurations | Справочник банков и их настройки
│   │   │   ├── 📄 business-limits.ts - Бизнес-лимиты | Business rules | Ограничения для бизнес-логики
│   │   │   ├── 📄 business.ts - Бизнес-константы | Business logic | Основные бизнес-правила системы
│   │   │   ├── 📄 contacts.ts - Контактные данные | Contact info | Информация для связи и поддержки
│   │   │   ├── 📄 currency-formats.ts - Форматы валют | Formatting rules | Правила отображения валют
│   │   │   ├── 📄 decimal-precision.ts - Точность десятичных чисел | Number precision | Настройки точности вычислений
│   │   │   ├── 📄 exchange-currencies.ts - Валюты обмена | Currency list | Поддерживаемые валюты для обмена
│   │   │   ├── 📄 exchange.ts - Константы обмена | Exchange logic | Основные константы процесса обмена
│   │   │   ├── 📄 fiat-currencies.ts - Фиатные валюты | Fiat currencies | Традиционные валюты и их настройки
│   │   │   ├── 📄 index.ts - Главный экспорт | Module exports | Централизованный экспорт всех констант
│   │   │   ├── 📄 linter-limits.ts - Лимиты линтера | Code quality | Ограничения для инструментов качества кода
│   │   │   ├── 📄 order-statuses.ts - Статусы заказов | Order states | Все возможные состояния заказов
│   │   │   ├── 📄 percentage-calculations.ts - Процентные вычисления | Math constants | Константы для расчета процентов
│   │   │   ├── 📄 rate-limits.ts - Лимиты запросов | API rate limiting | Ограничения частоты API вызовов
│   │   │   ├── 📄 seo.ts - SEO константы | SEO settings | Настройки поисковой оптимизации
│   │   │   ├── 📄 time-constants.ts - Временные константы | Time intervals | Интервалы времени и таймауты
│   │   │   ├── 📄 ui.ts - UI константы | Interface settings | Настройки пользовательского интерфейса
│   │   │   ├── 📄 user.ts - Пользовательские константы | User settings | Константы для работы с пользователями
│   │   │   ├── 📄 validation-bounds.ts - Границы валидации | Validation limits | Лимиты для проверки данных
│   │   │   └── 📄 validation.ts - Константы валидации | Validation rules | Правила и сообщения валидации
│   │   ├── 📖 README.md - Документация пакета | Package guide | Руководство по использованию констант
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация и зависимости пакета
│   │   ├── 📄 tsconfig.json - Конфигурация TypeScript | Compilation settings | Настройки компиляции констант
│   │   ├── 📄 tsconfig.tsbuildinfo 🚫 (auto-hidden) - Кэш TypeScript | Compilation cache | Кэш компиляции TypeScript
│   │   └── 📄 tsup.config.ts - Конфигурация сборки | Build configuration | Настройки bundler'а tsup
│   ├── 📁 design-tokens/ - Токены дизайн-системы | Design system | Централизованные переменные дизайна
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок пакета
│   │   ├── 📖 README.md - Документация пакета | Design tokens guide | Руководство по использованию токенов дизайна
│   │   ├── 📄 colors.js - Цветовая палитра | Color variables | Система цветов дизайн-системы
│   │   ├── 📄 form-patterns.js - Паттерны форм | Form styling | Стандартные стили для форм
│   │   ├── 📄 index.d.ts - TypeScript типы | Type definitions | Типизация для токенов дизайна
│   │   ├── 📄 index.js - Главный экспорт | Module exports | Объединение всех токенов дизайна
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация пакета токенов
│   │   ├── 📄 spacing.js - Система отступов | Spacing variables | Токены для margin, padding, gaps
│   │   └── 📄 typography.js - Типографика | Typography variables | Настройки шрифтов и текста
│   ├── 📁 eslint-config/ - Конфигурация ESLint | Code quality | Централизованные правила линтинга для монорепо
│   │   ├── 📖 README.md - Документация пакета | ESLint guide | Руководство по настройке и использованию линтера
│   │   ├── 📄 api.js - Правила для API | API linting | ESLint конфигурация для серверного кода
│   │   ├── 📄 base.js - Базовые правила | Base configuration | Основные правила линтинга
│   │   ├── 📄 configs.js - Общие конфигурации | Shared configs | Переиспользуемые конфигурации ESLint
│   │   ├── 📄 ignores.js - Игнорируемые файлы | Ignore patterns | Файлы и папки исключенные из линтинга
│   │   ├── 📄 lazy-loading.js - Ленивая загрузка правил | Performance optimization | Оптимизация загрузки конфигураций
│   │   ├── 📄 next.js - Правила для Next.js | Next.js specific | ESLint конфигурация для Next.js приложений
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация ESLint пакета
│   │   ├── 📄 performance-benchmark.js - Бенчмарки производительности | Performance testing | Измерение производительности линтинга
│   │   ├── 📄 performance-utils.ts - Утилиты производительности | Performance helpers | Инструменты для оптимизации ESLint
│   │   ├── 📄 react-internal.js - Внутренние правила React | React internals | ESLint для внутренних компонентов React
│   │   ├── 📄 react.js - Правила для React | React linting | ESLint конфигурация для React компонентов
│   │   ├── 📄 shared-rules.js - Общие правила | Shared linting rules | Переиспользуемые правила между конфигурациями
│   │   ├── 📄 testing.js - Правила для тестов | Testing linting | ESLint конфигурация для тестовых файлов
│   │   ├── 📄 ui-library.js - Правила для UI библиотеки | UI component linting | ESLint для UI компонентов
│   │   └── 📄 utils.js - Утилитарные правила | Utility linting | ESLint для утилитарных функций
│   ├── 📁 exchange-core/ - Ядро бизнес-логики | Business domain | Центральная бизнес-логика обменника
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок пакета
│   │   ├── 📁 dist/ 🚫 (auto-hidden) - Скомпилированные файлы | Build output | Результат сборки ядра бизнес-логики
│   │   ├── 📁 src/ - Исходный код ядра | Core business logic | Основная бизнес-логика системы обмена
│   │   │   ├── 📁 data/ - Управление данными | Data management | Работа с данными и моками
│   │   │   │   ├── 📄 index.ts - Экспорты данных | Data exports | Централизованный экспорт управления данными
│   │   │   │   ├── 📄 manager.ts - Менеджеры данных | Data managers | Управление пользователями и заказами
│   │   │   │   ├── 📄 mock-data.ts - Моковые данные | Mock data | Тестовые данные для разработки
│   │   │   │   └── 📄 mock-factory.ts - Фабрика моков | Mock generation | Генерация тестовых объектов
│   │   │   ├── 📁 services/ - Сервисные функции | Business services | Специализированные бизнес-сервисы
│   │   │   │   ├── 📄 crypto-address-generation.ts - Генерация крипто-адресов | Crypto services | Создание адресов кошельков
│   │   │   │   ├── 📄 id-generation.ts - Генерация идентификаторов | ID services | Создание уникальных идентификаторов
│   │   │   │   └── 📄 index.ts - Экспорты сервисов | Service exports | Централизованный экспорт сервисов
│   │   │   ├── 📁 types/ - Типы данных | TypeScript types | Все типы данных системы обмена
│   │   │   │   ├── 📄 auth.ts - Типы авторизации | Auth types | Типы для системы авторизации
│   │   │   │   ├── 📄 contact.ts - Типы контактов | Contact types | Типы для контактной информации
│   │   │   │   ├── 📄 currency.ts - Типы валют | Currency types | Типы для работы с валютами
│   │   │   │   ├── 📄 fiat.ts - Типы фиатных валют | Fiat types | Типы для традиционных валют
│   │   │   │   ├── 📄 index.ts - Экспорты типов | Type exports | Централизованный экспорт всех типов
│   │   │   │   ├── 📄 order.ts - Типы заказов | Order types | Типы для заказов и обменов
│   │   │   │   ├── 📄 transaction.ts - Типы транзакций | Transaction types | Типы для финансовых операций
│   │   │   │   └── 📄 user.ts - Типы пользователей | User types | Типы для пользователей системы
│   │   │   ├── 📁 utils/ - Утилитарные функции | Business utilities | Вспомогательные функции бизнес-логики
│   │   │   │   ├── 📄 access-validators.ts - Валидаторы доступа | Access validation | Проверка прав доступа
│   │   │   │   ├── 📄 calculations.ts - Вычисления | Business calculations | Финансовые и бизнес-расчеты
│   │   │   │   ├── 📄 composite-validators.ts - Композитные валидаторы | Complex validation | Сложные проверки данных
│   │   │   │   ├── 📄 crypto.ts - Криптографические утилиты | Crypto utilities | Функции для работы с криптографией
│   │   │   │   ├── 📄 data-sanitizers.ts - Санитизаторы данных | Data cleaning | Очистка и нормализация данных
│   │   │   │   └── 📄 type-guards.ts - Защитники типов | Type checking | TypeScript type guards
│   │   │   └── 📄 index.ts - Главный экспорт | Core exports | Основной экспорт всего ядра
│   │   ├── 📖 README.md - Документация пакета | Core package guide | Руководство по использованию ядра
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация ядра бизнес-логики
│   │   ├── 📄 tsconfig.json - Конфигурация TypeScript | Compilation settings | Настройки компиляции ядра
│   │   └── 📄 tsconfig.tsbuildinfo 🚫 (auto-hidden) - Кэш TypeScript | Compilation cache | Кэш компиляции TypeScript
│   ├── 📁 hooks/ - React хуки и состояние | State management | Управление состоянием и бизнес-логика через хуки
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок пакета
│   │   ├── 📁 dist/ 🚫 (auto-hidden) - Скомпилированные файлы | Build output | Результат сборки хуков и состояния
│   │   ├── 📁 src/ - Исходный код хуков | React hooks source | Все хуки и состояние приложения
│   │   │   ├── 📁 business/ - Бизнес-хуки | Business logic hooks | Хуки для бизнес-процессов
│   │   │   │   ├── 📄 authMessages.ts - Сообщения авторизации | Auth messaging | Хуки для сообщений системы авторизации
│   │   │   │   ├── 📄 useExchange.ts - Хук обмена | Exchange logic | Основная логика процесса обмена
│   │   │   │   ├── 📄 useFormTypes.ts - Типы форм | Form type management | Управление типами форм
│   │   │   │   ├── 📄 useFormWithNextIntl.ts - Формы с интернационализацией | i18n forms | Локализованные формы
│   │   │   │   ├── 📄 useMathCaptcha.ts - Математическая капча | Security captcha | Хук для математических проверок
│   │   │   │   └── 📄 useOrderTracking.ts - Отслеживание заказов | Order tracking | Логика отслеживания состояния заказов
│   │   │   ├── 📁 state/ - Глобальное состояние | Zustand stores | Центральное управление состоянием приложения
│   │   │   │   ├── 📄 exchange-constants.ts - Константы обмена | Exchange constants | Константы для стора обмена
│   │   │   │   ├── 📄 exchange-fiat-actions.ts - Действия фиата | Fiat actions | Действия для работы с фиатными валютами
│   │   │   │   ├── 📄 exchange-helpers.ts - Помощники обмена | Exchange utilities | Вспомогательные функции для обмена
│   │   │   │   ├── 📄 exchange-selectors.ts - Селекторы обмена | State selectors | Селекторы для получения данных обмена
│   │   │   │   ├── 📄 exchange-store.ts - Стор обмена | Exchange store | Главное состояние процесса обмена
│   │   │   │   ├── 📄 index.ts - Экспорты состояния | State exports | Централизованный экспорт всех сторов
│   │   │   │   ├── 📄 notification-store.ts - Стор уведомлений | Notification state | Управление системными уведомлениями
│   │   │   │   ├── 📄 trading-store.ts - Стор торговли | Trading state | Состояние торговых операций
│   │   │   │   └── 📄 ui-store.ts - Стор интерфейса | UI state | Состояние пользовательского интерфейса
│   │   │   ├── 📁 ui/ - UI хуки | Interface hooks | Хуки для работы с интерфейсом
│   │   │   │   ├── 📄 index.ts - Экспорты UI хуков | UI exports | Централизованный экспорт UI хуков
│   │   │   │   └── 📄 useScrollVisibility.ts - Видимость при скролле | Scroll behavior | Управление видимостью элементов при скролле
│   │   │   ├── 📄 client-hooks.ts - Клиентские хуки | Client-side hooks | Хуки для клиентской части приложения
│   │   │   ├── 📄 index.ts - Главный экспорт | Main exports | Основной экспорт всех хуков
│   │   │   ├── 📄 useExchangeStore.ts - Хук стора обмена | Exchange store hook | Подключение к стору обмена
│   │   │   ├── 📄 useNotifications.ts - Хук уведомлений | Notifications hook | Работа с системными уведомлениями
│   │   │   ├── 📄 useTheme.ts - Хук темы | Theme hook | Управление темной/светлой темой
│   │   │   └── 📄 useUIStore.ts - Хук UI стора | UI store hook | Подключение к стору интерфейса
│   │   ├── 📝 CHANGELOG.md - История изменений | Change log | Журнал изменений пакета хуков
│   │   ├── 📖 README.md - Документация пакета | Hooks guide | Руководство по использованию хуков
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация пакета хуков
│   │   └── 📄 tsconfig.json - Конфигурация TypeScript | Compilation settings | Настройки компиляции хуков
│   ├── 📁 providers/ - React провайдеры | Context providers | Контекстные провайдеры для всего приложения
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок пакета
│   │   ├── 📁 src/ - Исходный код провайдеров | Provider source | Все провайдеры приложения
│   │   │   ├── 📄 index.tsx - Главный экспорт | Provider exports | Централизованный экспорт всех провайдеров
│   │   │   ├── 📄 theme-provider.tsx - Провайдер темы | Theme context | Управление темной/светлой темой
│   │   │   └── 📄 theme-script.tsx - Скрипт темы | Theme initialization | Инициализация темы до загрузки React
│   │   ├── 📝 CHANGELOG.md - История изменений | Change log | Журнал изменений пакета провайдеров
│   │   ├── 📖 README.md - Документация пакета | Providers guide | Руководство по использованию провайдеров
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация пакета провайдеров
│   │   └── 📄 tsconfig.json - Конфигурация TypeScript | Compilation settings | Настройки компиляции провайдеров
│   ├── 📁 style-scanner/ - Сканер стилей и компонентов | Analysis tool | Инструмент анализа структуры стилей проекта
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок пакета
│   │   ├── 📁 bin/ 🚫 (auto-hidden) - Исполняемые файлы | CLI binaries | Скомпилированные CLI команды
│   │   ├── 📁 dist/ 🚫 (auto-hidden) - Скомпилированные файлы | Build output | Результат сборки сканера
│   │   ├── 📁 node_modules/ 🚫 (auto-hidden) - Локальные зависимости | NPM packages | Зависимости сканера стилей
│   │   ├── 📁 src/ - Исходный код сканера | Scanner source | Логика анализа стилей и компонентов
│   │   │   ├── 📁 config/ - Конфигурация сканера | Scanner settings | Настройки и паттерны для анализа
│   │   │   │   ├── 📄 default-patterns.ts - Стандартные паттерны | Default patterns | Базовые паттерны поиска стилей
│   │   │   │   └── 📄 performance.ts - Настройки производительности | Performance config | Оптимизация работы сканера
│   │   │   ├── 📁 constants/ - Константы сканера | Scanner constants | Константы для работы анализатора
│   │   │   │   └── 📄 index.ts - Экспорты констант | Constants exports | Централизованные константы сканера
│   │   │   ├── 📁 core/ - Ядро сканера | Core logic | Основная логика анализа
│   │   │   │   ├── 📄 component-tree-simple.ts - Простое дерево компонентов | Component analysis | Упрощенный анализ структуры компонентов
│   │   │   │   └── 📄 main-scanner.ts - Главный сканер | Main scanner logic | Основная логика сканирования
│   │   │   ├── 📁 scanners/ - Специализированные сканеры | Specific scanners | Сканеры для разных типов файлов
│   │   │   │   ├── 📄 base-scanner.ts - Базовый сканер | Base scanner class | Абстрактный класс для всех сканеров
│   │   │   │   ├── 📄 index.ts - Экспорты сканеров | Scanner exports | Централизованный экспорт сканеров
│   │   │   │   ├── 📄 layout-scanner.ts - Сканер layout файлов | Layout analysis | Анализ layout компонентов
│   │   │   │   ├── 📄 main-scanner.ts - Главный сканер | Main scanning | Основной процесс сканирования
│   │   │   │   ├── 📄 page-scanner.ts - Сканер страниц | Page analysis | Анализ страничных компонентов
│   │   │   │   ├── 📄 tailwind-config-scanner.ts - Сканер Tailwind конфигурации | Tailwind analysis | Анализ конфигурации Tailwind CSS
│   │   │   │   └── 📄 ui-scanner.ts - Сканер UI компонентов | UI analysis | Анализ пользовательских интерфейсов
│   │   │   ├── 📁 services/ - Сервисы сканера | Scanner services | Вспомогательные сервисы для анализа
│   │   │   │   ├── 📄 component-analysis.service.ts - Сервис анализа компонентов | Component service | Детальный анализ React компонентов
│   │   │   │   ├── 📄 content-generation.service.ts - Сервис генерации контента | Content generation | Создание отчетов и документации
│   │   │   │   ├── 📄 file-management.service.ts - Сервис управления файлами | File management | Работа с файловой системой
│   │   │   │   ├── 📄 index.ts - Экспорты сервисов | Service exports | Централизованный экспорт сервисов
│   │   │   │   ├── 📄 markdown-formatting.service.ts - Сервис форматирования Markdown | Markdown formatting | Форматирование отчетов в Markdown
│   │   │   │   └── 📄 markdown-generator.ts - Генератор Markdown | Markdown generation | Создание Markdown документов
│   │   │   ├── 📁 types/ - Типы сканера | Scanner types | TypeScript типы для сканера
│   │   │   │   └── 📄 scanner.ts - Типы сканера | Type definitions | Основные типы для работы сканера
│   │   │   ├── 📁 utils/ - Утилиты сканера | Scanner utilities | Вспомогательные функции для анализа
│   │   │   │   ├── 📄 component-analyzers.ts - Анализаторы компонентов | Component analyzers | Функции анализа React компонентов
│   │   │   │   ├── 📄 component-parser-simple.ts - Простой парсер компонентов | Simple parser | Упрощенный парсинг компонентов
│   │   │   │   ├── 📄 file-utils.ts - Файловые утилиты | File utilities | Работа с файловой системой
│   │   │   │   ├── 📄 logger.ts - Логгер | Logging utility | Система логирования сканера
│   │   │   │   ├── 📄 markdown-utils.ts - Утилиты Markdown | Markdown utilities | Вспомогательные функции для Markdown
│   │   │   │   └── 📄 style-extractor.ts - Экстрактор стилей | Style extraction | Извлечение CSS стилей из компонентов
│   │   │   └── 📄 index.ts - Главный экспорт | Main exports | Основной экспорт всего сканера
│   │   ├── 📁 style-docs/ 🚫 (auto-hidden) - Документация стилей | Generated docs | Автогенерируемая документация стилей
│   │   ├── 📄 .eslintrc.json - Конфигурация ESLint | Linting config | Правила линтинга для сканера
│   │   ├── 📝 CHANGELOG.md - История изменений | Change log | Журнал изменений сканера стилей
│   │   ├── 📝 CODE_REVIEW_REPORT.md - Отчет код-ревью | Code review | Результаты проверки кода сканера
│   │   ├── 📖 README.md - Документация пакета | Scanner guide | Руководство по использованию сканера
│   │   ├── 📄 debug-imports.js - Отладка импортов | Debug script | Скрипт для отладки импортов модулей
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация пакета сканера стилей
│   │   └── 📄 tsconfig.json - Конфигурация TypeScript | Compilation settings | Настройки компиляции сканера
│   ├── 📁 tailwind-preset/ - Предустановки Tailwind CSS | CSS preset | Централизованные CSS переменные и конфигурация
│   │   ├── 📄 .eslintrc.cjs - Конфигурация ESLint | Linting config | Правила линтинга для preset пакета
│   │   ├── 📖 README.md - Документация пакета | Preset guide | Руководство по использованию CSS preset
│   │   ├── 🎨 globals.css - Глобальные CSS переменные | CSS variables | Единый источник CSS переменных для всех приложений
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация пакета Tailwind preset
│   │   └── 📄 preset.js - Конфигурация Tailwind | Tailwind config | Базовая конфигурация Tailwind CSS
│   ├── 📁 typescript-config/ - Конфигурации TypeScript | TS configurations | Переиспользуемые конфигурации компиляции TypeScript
│   │   ├── 📖 README.md - Документация пакета | TypeScript config guide | Руководство по использованию TS конфигураций
│   │   ├── 📄 base.json - Базовая конфигурация | Base TS config | Общие настройки TypeScript для всех пакетов
│   │   ├── 📄 nextjs.json - Конфигурация для Next.js | Next.js TS config | Специализированные настройки для Next.js приложений
│   │   ├── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация пакета TypeScript настроек
│   │   └── 📄 react-library.json - Конфигурация для React библиотек | React library config | Настройки для React библиотечных пакетов
│   ├── 📁 ui/ - UI компоненты и библиотека | shadcn/ui components | Центральная библиотека пользовательских интерфейсов
│   │   ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок UI пакета
│   │   ├── 📁 dist/ 🚫 (auto-hidden) - Скомпилированные файлы | Build output | Результат сборки UI библиотеки
│   │   ├── 📁 node_modules/ 🚫 (auto-hidden) - Локальные зависимости | NPM packages | Зависимости UI пакета
│   │   ├── 📁 src/ - Исходный код UI | UI source code | Все компоненты пользовательского интерфейса
│   │   │   ├── 📁 __tests__/ - Тесты компонентов | Unit tests | Тестирование UI компонентов
│   │   │   │   ├── 📄 Button.test.tsx - Тест компонента Button | Button testing | Unit тесты для кнопок
│   │   │   │   └── 📄 DataTable.test.tsx - Тест компонента DataTable | Table testing | Unit тесты для таблиц данных
│   │   │   ├── 📁 components/ - Все UI компоненты | React components | Библиотека переиспользуемых компонентов
│   │   │   │   ├── 📁 auth/ - Компоненты авторизации | Auth components | UI элементы для форм входа и регистрации
│   │   │   │   │   ├── 📄 AuthCaptchaField.tsx - Поле капчи | Captcha field | Компонент математической капчи для форм
│   │   │   │   │   ├── 📄 AuthConfirmPasswordField.tsx - Поле подтверждения пароля | Password confirmation | Компонент подтверждения пароля
│   │   │   │   │   ├── 📄 AuthEmailField.tsx - Поле email | Email field | Компонент ввода электронной почты
│   │   │   │   │   ├── 📄 AuthFormLayout.tsx - Layout форм авторизации | Auth form layout | Общий layout для форм входа/регистрации
│   │   │   │   │   ├── 📄 AuthPasswordField.tsx - Поле пароля | Password field | Компонент ввода пароля с валидацией
│   │   │   │   │   ├── 📄 AuthSubmitButton.tsx - Кнопка отправки | Submit button | Кнопка подтверждения форм авторизации
│   │   │   │   │   ├── 📄 AuthSwitchButton.tsx - Кнопка переключения | Switch button | Переключение между входом и регистрацией
│   │   │   │   │   └── 📄 index.ts - Экспорты auth компонентов | Auth exports | Централизованный экспорт компонентов авторизации
│   │   │   │   ├── 📁 error-boundaries/ - Обработчики ошибок | Error handling | Компоненты для обработки ошибок React
│   │   │   │   │   ├── 📄 base-error-boundary.tsx - Базовый обработчик ошибок | Base error boundary | Общий компонент обработки ошибок
│   │   │   │   │   ├── 📄 exchange-error-boundary.tsx - Обработчик ошибок обмена | Exchange error boundary | Специализированная обработка ошибок обмена
│   │   │   │   │   ├── 📄 index.ts - Экспорты error boundaries | Error boundary exports | Централизованный экспорт обработчиков ошибок
│   │   │   │   │   └── 📄 layout-error-boundary.tsx - Обработчик ошибок layout | Layout error boundary | Обработка ошибок в layout компонентах
│   │   │   │   ├── 📁 tree-view/ - Компоненты дерева | Tree components | UI для отображения древовидных структур
│   │   │   │   │   └── 📄 TreeNodeItem.tsx - Элемент узла дерева | Tree node | Компонент для отображения узла в дереве
│   │   │   │   ├── 📁 ui/ - Базовые UI компоненты | shadcn/ui primitives | Основные переиспользуемые UI элементы
│   │   │   │   │   ├── 📄 button.tsx - Компонент кнопки | Button component | Базовый компонент кнопки с вариантами стилей
│   │   │   │   │   ├── 📄 card.tsx - Компонент карточки | Card component | Контейнер для группировки контента
│   │   │   │   │   ├── 📄 dialog.tsx - Компонент диалога | Dialog component | Модальные окна и диалоги
│   │   │   │   │   ├── 📄 dropdown-menu.tsx - Выпадающее меню | Dropdown menu | Компонент выпадающего меню
│   │   │   │   │   ├── 📄 form.tsx - Компонент формы | Form component | Базовые элементы форм с валидацией
│   │   │   │   │   ├── 📄 input.tsx - Поле ввода | Input component | Базовый компонент поля ввода
│   │   │   │   │   ├── 📄 label.tsx - Компонент подписи | Label component | Подписи для полей форм
│   │   │   │   │   ├── 📄 math-captcha.tsx - Математическая капча | Math captcha | Компонент математической проверки
│   │   │   │   │   ├── 📄 notification.tsx - Компонент уведомлений | Notification component | Системные уведомления и алерты
│   │   │   │   │   ├── 📄 select.tsx - Компонент выбора | Select component | Выпадающий список для выбора опций
│   │   │   │   │   ├── 📄 spinner.tsx - Компонент загрузки | Spinner component | Индикатор загрузки и ожидания
│   │   │   │   │   ├── 📄 table.tsx - Компонент таблицы | Table component | Базовая таблица для отображения данных
│   │   │   │   │   └── 📄 textarea.tsx - Многострочное поле | Textarea component | Компонент многострочного ввода текста
│   │   │   │   ├── 📄 adaptive-container.tsx - Адаптивный контейнер | Responsive container | Контейнер с адаптивным поведением
│   │   │   │   ├── 📄 admin-panel-compound.tsx - Составной компонент админки | Admin panel compound | Комплексный компонент административной панели
│   │   │   │   ├── 📄 auth-form-compound.tsx - Составная форма авторизации | Auth form compound | Комплексный компонент форм авторизации
│   │   │   │   ├── 📄 data-table-compound.tsx - Составная таблица данных | Data table compound | Комплексная таблица с функциональностью
│   │   │   │   ├── 📄 exchange-form.tsx - Форма обмена | Exchange form | Основная форма процесса обмена валют
│   │   │   │   ├── 📄 floating-action-button.tsx - Плавающая кнопка действия | FAB component | Плавающая кнопка для быстрых действий
│   │   │   │   ├── 📄 footer-compound.tsx - Составной футер | Footer compound | Комплексный компонент подвала сайта
│   │   │   │   ├── 📄 header-compound.tsx - Составная шапка | Header compound | Комплексный компонент шапки сайта
│   │   │   │   ├── 📄 index.ts - Экспорты UI компонентов | UI exports | Централизованный экспорт всех UI компонентов
│   │   │   │   ├── 📄 theme-toggle.tsx - Переключатель темы | Theme toggle | Компонент переключения светлой/темной темы
│   │   │   │   └── 📄 tree-view.tsx - Компонент дерева | Tree view | Отображение древовидных структур данных
│   │   │   ├── 📁 lib/ - Библиотеки UI | UI utilities | Вспомогательные функции и утилиты для UI
│   │   │   │   ├── 📄 auth-form-types.ts - Типы форм авторизации | Auth form types | TypeScript типы для форм авторизации
│   │   │   │   ├── 📄 auth-helpers.tsx - Помощники авторизации | Auth helpers | Вспомогательные функции для авторизации
│   │   │   │   ├── 📄 header-helpers.tsx - Помощники шапки | Header helpers | Утилиты для компонентов шапки
│   │   │   │   ├── 📄 header-types.ts - Типы шапки | Header types | TypeScript типы для компонентов шапки
│   │   │   │   ├── 📄 shared-styles.ts - Общие стили | Shared styles | Переиспользуемые стили и CSS классы
│   │   │   │   ├── 📄 useMathCaptchaLocal.ts - Локальный хук капчи | Local captcha hook | Хук математической капчи для UI пакета
│   │   │   │   └── 📄 utils.ts - Общие утилиты | UI utilities | Общие вспомогательные функции UI
│   │   │   ├── 📁 stories/ - Storybook истории | Component stories | Документация компонентов в Storybook
│   │   │   │   ├── 📁 design-tokens/ - Истории токенов дизайна | Design token stories | Storybook для токенов дизайн-системы
│   │   │   │   │   ├── 📄 Colors.stories.tsx - История цветов | Colors story | Документация цветовой палитры
│   │   │   │   │   ├── 📄 Spacing.stories.tsx - История отступов | Spacing story | Документация системы отступов
│   │   │   │   │   └── 📄 Typography.stories.tsx - История типографики | Typography story | Документация типографической системы
│   │   │   │   ├── 📄 Button.stories.tsx - История кнопки | Button story | Storybook для компонента кнопки
│   │   │   │   ├── 📄 Card.stories.tsx - История карточки | Card story | Storybook для компонента карточки
│   │   │   │   ├── 📄 DataTable.stories.tsx - История таблицы данных | DataTable story | Storybook для компонента таблицы
│   │   │   │   ├── 📄 Dialog.stories.tsx - История диалога | Dialog story | Storybook для компонента диалога
│   │   │   │   ├── 📄 DropdownMenu.stories.tsx - История выпадающего меню | DropdownMenu story | Storybook для выпадающего меню
│   │   │   │   ├── 📄 Footer.stories.tsx - История футера | Footer story | Storybook для компонента футера
│   │   │   │   ├── 📄 Form.stories.tsx - История формы | Form story | Storybook для компонентов форм
│   │   │   │   ├── 📄 Input.stories.tsx - История поля ввода | Input story | Storybook для компонента ввода
│   │   │   │   ├── 📄 Label.stories.tsx - История подписи | Label story | Storybook для компонента подписи
│   │   │   │   ├── 📄 Notification.stories.tsx - История уведомлений | Notification story | Storybook для компонента уведомлений
│   │   │   │   ├── 📄 Select.stories.tsx - История выбора | Select story | Storybook для компонента выбора
│   │   │   │   ├── 📄 Spinner.stories.tsx - История загрузки | Spinner story | Storybook для компонента загрузки
│   │   │   │   ├── 📄 Table.stories.tsx - История таблицы | Table story | Storybook для компонента таблицы
│   │   │   │   ├── 📄 Textarea.stories.tsx - История многострочного поля | Textarea story | Storybook для многострочного ввода
│   │   │   │   └── 📄 TreeView.stories.tsx - История дерева | TreeView story | Storybook для компонента дерева
│   │   │   ├── 📁 styles/ - Стили UI пакета | UI styles | CSS стили для UI компонентов
│   │   │   │   ├── 🎨 adaptive-container.css - Стили адаптивного контейнера | Responsive styles | CSS для адаптивного контейнера
│   │   │   │   └── 🎨 globals.css - Глобальные стили UI | Global UI styles | Базовые стили для UI библиотеки
│   │   │   ├── 📁 types/ - Типы UI пакета | UI types | TypeScript типы для UI компонентов
│   │   │   │   ├── 📄 auth-fields.ts - Типы полей авторизации | Auth field types | Типы для полей форм авторизации
│   │   │   │   └── 📄 jest.d.ts - Типы Jest | Jest types | TypeScript типы для тестового окружения
│   │   │   └── 📄 index.ts - Главный экспорт UI | Main UI exports | Основной экспорт всей UI библиотеки
│   │   ├── 📁 turbo/ - Генераторы Turborepo | Code generation | Автоматическая генерация кода для UI компонентов
│   │   │   └── 📁 generators/ - Шаблоны генераторов | Generator templates | Шаблоны для автоматического создания компонентов
│   │   │       ├── 📁 templates/ - Шаблоны компонентов | Component templates | Шаблоны для генерации новых компонентов
│   │   │       │   └── 📄 component.hbs - Шаблон компонента | Component template | Handlebars шаблон для создания компонента
│   │   │       └── 📄 config.ts - Конфигурация генератора | Generator config | Настройки автоматической генерации
│   │   ├── 📖 README.md - Документация UI пакета | UI library guide | Полное руководство по использованию UI библиотеки
│   │   ├── 📄 components.json - Конфигурация shadcn/ui | shadcn/ui config | Конфигурация для shadcn/ui CLI
│   │   ├── 📄 jest.config.js - Конфигурация Jest | Testing config | Настройки тестового окружения UI пакета
│   │   ├── 📄 jest.setup.js - Настройка Jest | Jest setup | Инициализация тестового окружения
│   │   ├── 📄 package.json - Манифест UI пакета | NPM configuration | Конфигурация и зависимости UI библиотеки
│   │   ├── 📄 tailwind.config.cjs - Конфигурация Tailwind | Tailwind config | Настройки Tailwind CSS для UI компонентов
│   │   └── 📄 tsconfig.json - Конфигурация TypeScript | TS compilation | Настройки компиляции UI библиотеки
│   └── 📁 utils/ - Утилитарные функции | Utility functions | Общие вспомогательные функции для всех приложений
│       ├── 📁 .turbo/ 🚫 (auto-hidden) - Кэш Turborepo | Оптимизация сборки | Ускорение повторных сборок пакета
│       ├── 📁 src/ - Исходный код утилит | Utils source code | Все утилитарные функции системы
│       │   ├── 📁 validation/ - Функции валидации | Validation utilities | Полная система валидации данных
│       │   │   ├── 📄 constants.ts - Константы валидации | Validation constants | Константы для правил валидации
│       │   │   ├── 📄 core.ts - Ядро валидации | Validation core | Основные функции валидации
│       │   │   ├── 📄 field-validation.ts - Валидация полей | Field validation | Валидация отдельных полей форм
│       │   │   ├── 📄 handlers.ts - Обработчики валидации | Validation handlers | Обработчики результатов валидации
│       │   │   ├── 📄 hooks.ts - Хуки валидации | Validation hooks | React хуки для валидации
│       │   │   ├── 📄 index.ts - Экспорты валидации | Validation exports | Централизованный экспорт валидации
│       │   │   ├── 📄 schema-helpers.ts - Помощники схем | Schema helpers | Вспомогательные функции для схем
│       │   │   ├── 📄 schemas-basic.ts - Базовые схемы | Basic schemas | Основные схемы валидации
│       │   │   ├── 📄 schemas-crypto.ts - Криптографические схемы | Crypto schemas | Схемы для валидации криптовалют
│       │   │   ├── 📄 security-enhanced-operator.ts - Операторы безопасности | Security operators | Операторы для усиленной валидации
│       │   │   ├── 📄 security-enhanced-schemas.ts - Схемы безопасности | Security schemas | Схемы с усиленной безопасностью
│       │   │   ├── 📄 security-enhanced-utils.ts - Утилиты безопасности | Security utils | Функции для безопасной валидации
│       │   │   ├── 📄 security-utils.ts - Общие утилиты безопасности | General security | Общие функции безопасности
│       │   │   ├── 📄 single-field.ts - Валидация одного поля | Single field validation | Валидация отдельных полей
│       │   │   ├── 📄 validation-utils.ts - Утилиты валидации | Validation utilities | Общие утилиты для валидации
│       │   │   └── 📄 zod-helpers.ts - Помощники Zod | Zod helpers | Вспомогательные функции для Zod валидации
│       │   ├── 📄 calculations.ts - Математические вычисления | Math calculations | Функции для финансовых расчетов
│       │   ├── 📄 formatting.ts - Форматирование данных | Data formatting | Функции форматирования чисел, дат, валют
│       │   ├── 📄 index.ts - Главный экспорт | Main utils exports | Основной экспорт всех утилит
│       │   ├── 📄 input-validation.ts - Валидация ввода | Input validation | Валидация пользовательского ввода
│       │   ├── 📄 next-intl-validation.ts - Валидация с интернационализацией | i18n validation | Валидация с поддержкой локализации
│       │   ├── 📄 order-status.ts - Утилиты статусов заказов | Order status utils | Функции для работы со статусами
│       │   ├── 📄 order-utils.ts - Утилиты заказов | Order utilities | Общие функции для работы с заказами
│       │   ├── 📄 scroll-utils.ts - Утилиты скролла | Scroll utilities | Функции для работы с прокруткой страницы
│       │   ├── 📄 store-factory.ts - Фабрика сторов | Store factory | Создание и настройка Zustand сторов
│       │   ├── 📄 trpc-errors.ts - Ошибки tRPC | tRPC error handling | Обработка ошибок tRPC API
│       │   └── 📄 validation-helpers.ts - Помощники валидации | Validation helpers | Дополнительные функции валидации
│       ├── 📖 README.md - Документация утилит | Utils guide | Руководство по использованию утилитарных функций
│       └── 📄 package.json - Манифест пакета | NPM configuration | Конфигурация пакета утилит
├── 📁 public/ - Статические ресурсы корня | Static assets | Публичные файлы доступные по прямым ссылкам
│   ├── 🖼️ globe.svg - Иконка глобуса | SVG icon | Универсальная иконка для интернационализации
│   ├── 🖼️ vercel.svg - Логотип Vercel | SVG logo | Брендинг платформы деплоя
│   └── 🖼️ window.svg - Иконка окна | SVG icon | Иконка для UI элементов интерфейса
├── 📁 scripts/ - Служебные скрипты | Automation scripts | Скрипты для автоматизации разработки и деплоя
│   ├── 🐚 analyze-project-structure.ps1 - Анализ структуры проекта | PowerShell script | Скрипт анализа архитектуры проекта
│   ├── 📄 bundle-analyzer.js - Анализатор бандла | Bundle analysis | Скрипт для анализа размера сборки
│   ├── 📄 checklist-reminder.mjs - Напоминания чек-листов | Checklist automation | Автоматизация напоминаний о процедурах
│   └── 📄 validate-cleanup.js - Валидация очистки | Cleanup validation | Проверка корректности очистки временных файлов
├── 🚫 .gitignore - Игнорируемые Git файлы | Git configuration | Файлы и папки исключенные из версионирования
├── 📄 .lintstagedrc.json - Конфигурация lint-staged | Pre-commit linting | Настройки линтинга для staged файлов
├── 📄 .npmrc - Конфигурация NPM | NPM settings | Настройки менеджера пакетов NPM
├── 📄 .prettierignore - Игнорируемые Prettier файлы | Prettier ignore | Файлы исключенные из форматирования
├── 📄 .prettierrc.json - Конфигурация Prettier | Code formatting | Настройки автоматического форматирования кода
├── 📄 .stylelintrc.json - Конфигурация Stylelint | CSS linting | Настройки линтинга CSS файлов
├── 📖 README.md - Главная документация проекта | Project overview | Основная информация о проекте и быстрый старт
├── 📄 bundle-stats.json - Статистика бандла | Bundle statistics | Данные о размере и составе сборки
├── 📄 commitlint.config.cjs - Конфигурация commitlint | Commit linting | Правила для проверки сообщений коммитов
├── 📄 eslint.config.mjs - Главная конфигурация ESLint | Code linting | Центральные правила линтинга для всего монорепо
├── 📄 jest.config.cjs - Конфигурация Jest | Testing framework | Настройки тестового фреймворка для проекта
├── 📄 jest.setup.cjs - Настройка Jest | Jest setup | Инициализация тестового окружения
├── 📄 package-lock.json - Заблокированные зависимости | Dependency lock | Зафиксированные версии всех зависимостей
├── 📄 package.json - Корневой манифест монорепо | Monorepo manifest | Главная конфигурация монорепозитория
├── 📄 playwright.config.ts - Конфигурация Playwright | E2E testing | Настройки инструмента end-to-end тестирования
├── 📄 postcss.config.cjs - Конфигурация PostCSS | CSS processing | Настройки постобработки CSS
├── 📄 project-structure.txt 🚫 (auto-hidden) - Текстовая структура проекта | Project structure | Автогенерируемая структура файлов
├── 📄 tsconfig.json - Корневая конфигурация TypeScript | TypeScript config | Базовые настройки компиляции для всего проекта
├── 📄 tsconfig.tsbuildinfo 🚫 (auto-hidden) - Кэш TypeScript | TS compilation cache | Кэш инкрементальной компиляции TypeScript
└── 📄 turbo.json - Конфигурация Turborepo | Monorepo orchestration | Настройки оркестрации сборок и задач в монорепо
```

---

## 📊 Сводная информация о проекте

**Тип проекта:** Turborepo монорепозиторий  
**Архитектура:** Микрофронтенды с общими пакетами  
**Основная технология:** Next.js 15 + TypeScript + tRPC  
**UI Система:** shadcn/ui + Tailwind CSS с централизованной архитектурой  
**Состояние:** Zustand + React Query  
**Тестирование:** Jest + Playwright + Storybook

### 🎯 Ключевые директории для разработки:

- **`apps/web/`** - Основное приложение обменника
- **`packages/constants/`** - Единый источник истины для всех констант
- **`packages/ui/`** - Центральная библиотека UI компонентов
- **`packages/hooks/`** - Управление состоянием и бизнес-логика
- **`packages/exchange-core/`** - Ядро бизнес-логики обмена
- **`docs/`** - Техническая документация и руководства

### ⚙️ Основные команды разработки:

```bash
npm run dev        # Запуск всех приложений в dev режиме
npm run build      # Сборка всего монорепо
npm run test       # Запуск всех тестов
npm run lint       # Линтинг кода
npm run storybook  # Запуск Storybook документации
```

---

_Generated by FileTree Pro Extension_
