# Документация проекта

Этот раздел содержит детальную документацию по всем аспектам проекта Exchanger.

## � Основные руководства

- **[DEVELOPER_GUIDE.md](core/DEVELOPER_GUIDE.md)** - **ГЛАВНОЕ** руководство разработчика с подробными инструкциями по всем технологиям, паттернам и best practices
- **[TASK_IMPLEMENTATION_GUIDE.md](core/TASK_IMPLEMENTATION_GUIDE.md)** - **УНИВЕРСАЛЬНЫЙ** гайд по реализации любой задачи с чек-листами, шаблонами кода и пошаговыми инструкциями

## 🔒 Безопасность и валидация

- **[SECURITY_ENHANCED_VALIDATION_GUIDE.md](core/SECURITY_ENHANCED_VALIDATION_GUIDE.md)** - **🚨 КРИТИЧЕСКИ ВАЖНО** Руководство по использованию security-enhanced validation schemas с XSS protection. ОБЯЗАТЕЛЬНО для всех разработчиков!
- **[VALIDATION_ARCHITECTURE_GUIDE.md](core/VALIDATION_ARCHITECTURE_GUIDE.md)** - **АРХИТЕКТУРНО ВАЖНО** Принципы трёхуровневой валидации, separation of concerns, migration стратегии
- **[UNIFIED_VALIDATION_GUIDE.md](core/UNIFIED_VALIDATION_GUIDE.md)** - **📋 ТЕХНИЧЕСКОЕ РУКОВОДСТВО** Гайд по унифицированной системе валидаций после устранения избыточности
- **[VALIDATION_LOCALIZATION_GUIDE.md](core/VALIDATION_LOCALIZATION_GUIDE.md)** - **🚨 КРИТИЧЕСКИ ВАЖНО** Исчерпывающее руководство по валидации с локализацией. ОБЯЗАТЕЛЬНО к изучению перед созданием форм!

## 🏗️ Архитектура и API

- **[ARCHITECTURE.md](core/ARCHITECTURE.md)** - Детальное описание архитектуры монорепозитория, структуры пакетов, технологий и best practices
- **[API_DOCS.md](core/API_DOCS.md)** - Документация API endpoints, tRPC процедур и интеграций
- **[I18N_ARCHITECTURE_GUIDE.md](core/I18N_ARCHITECTURE_GUIDE.md)** - **🌍 НОВОЕ** Модульная система переводов с performance-first loading и решением race condition проблем

## ⚙️ Контроль качества

- **[CENTRALIZED_ESLINT_ARCHITECTURE.md](core/CENTRALIZED_ESLINT_ARCHITECTURE.md)** - **НОВОЕ** Детальное описание новой централизованной архитектуры ESLint с lazy loading и performance tuning
- **[CODE_STYLE_GUIDE.md](core/CODE_STYLE_GUIDE.md)** - Руководство по стилю кода, централизованные ESLint правила и архитектурные паттерны
- **[CODE_REVIEW_PROTOCOLS.md](core/CODE_REVIEW_PROTOCOLS.md)** - Протоколы code review с централизованной архитектурой линтинга
- **[DEVELOPMENT_TOOLS_ARCHITECTURE.md](core/DEVELOPMENT_TOOLS_ARCHITECTURE.md)** - **НОВОЕ** Архитектурные паттерны для Development Tools с React Query setData() и modern optimistic updates
- **[PRE_COMMIT_GUIDE.md](process/PRE_COMMIT_GUIDE.md)** - Настройка pre-commit хуков с новой ESLint архитектурой

## 🎨 UI/UX и стилизация

- **[SEMANTIC_DESIGN_SYSTEM.md](core/SEMANTIC_DESIGN_SYSTEM.md)** - CSS Architecture v3.0 с semantic design tokens и centralized system
- **[MOBILE_ADAPTATION_GUIDELINES.md](core/MOBILE_ADAPTATION_GUIDELINES.md)** - Руководство по мобильной адаптации компонентов
- **[STORYBOOK_GUIDELINES.md](STORYBOOK_GUIDELINES.md)** - Руководство по документированию компонентов в Storybook

## 📊 Отчеты и статусы

- **[BUNDLE_SIZE_INVESTIGATION_REPORT.md](troubleshooting/BUNDLE_SIZE_INVESTIGATION_REPORT.md)** - Анализ размеров бандла и оптимизация
- **[EXHAUSTIVE_VERIFICATION_PROTOCOL.md](process/EXHAUSTIVE_VERIFICATION_PROTOCOL.md)** - Протокол всесторонней проверки изменений

## 🛠️ Дополнительные руководства

- **[NPM_COMMANDS_GUIDE.md](core/NPM_COMMANDS_GUIDE.md)** - Подробное руководство по командам NPM в монорепозитории
- **[UNIVERSAL_AUDIT_SYSTEM.md](process/UNIVERSAL_AUDIT_SYSTEM.md)** - Универсальная система аудита кода
- **[PROJECT_STRUCTURE_MAP.md](core/PROJECT_STRUCTURE_MAP.md)** - Карта структуры проекта с детальными описаниями

## 📋 Техническая документация

- **[ROLES_ARCHITECTURE.md](core/ROLES_ARCHITECTURE.md)** - Архитектура ролей и разрешений в системе
- **[RPD.md](business/RPD.md)** - Техническое описание проекта
- **[exchanger_AC.md](business/exchanger_AC.md)** - Техническое задание обменника

## 📂 Специализированные разделы

- **[ai-agent/](ai-agent/)** - Документация для работы с AI агентами
- **[tasks/](tasks/)** - Шаблоны и чек-листы для выполнения задач
- **[troubleshooting/](troubleshooting/)** - Руководства по устранению неполадок
  - **[I18N_TROUBLESHOOTING.md](troubleshooting/I18N_TROUBLESHOOTING.md)** - **🚨 ОБНОВЛЕНО** Решение проблем интернационализации включая race condition при navigation

## 🧭 Навигация

Для возврата к основному README проекта: [← Вернуться к главной](../README.md)
