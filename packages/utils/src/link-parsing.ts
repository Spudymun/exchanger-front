/**
 * Link Parsing Utilities
 * Централизованная система парсинга ссылок в переводах
 *
 * @description Обеспечивает консистентность парсинга маркеров ссылок
 * в текстах переводов и их замену на React компоненты
 */
import React from 'react';

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

/** Стандартные атрибуты безопасности для внешних ссылок */
const EXTERNAL_LINK_REL = 'noopener noreferrer';

/** Стандартные CSS классы для ссылок */
const DEFAULT_LINK_CLASSES = 'text-primary hover:underline';

// ============================================================================
// КОНСТАНТЫ МАРКЕРОВ ССЫЛОК
// ============================================================================

/**
 * Маркеры для разметки ссылок в переводах
 * Используются для обозначения начала и конца ссылок в JSON файлах переводов
 */
export const LINK_MARKERS = {
  /** Маркеры для ссылок на правила сервиса */
  RULES: {
    start: '[LINK_RULES_START]' as const,
    end: '[LINK_RULES_END]' as const,
  },
  /** Маркеры для ссылок на AML политику */
  AML: {
    start: '[LINK_AML_START]' as const,
    end: '[LINK_AML_END]' as const,
  },
  /** Маркеры для ссылок на политику конфиденциальности */
  PRIVACY: {
    start: '[LINK_PRIVACY_START]' as const,
    end: '[LINK_PRIVACY_END]' as const,
  },
  /** Маркеры для ссылок на политику возвратов */
  RETURNS: {
    start: '[LINK_RETURNS_START]' as const,
    end: '[LINK_RETURNS_END]' as const,
  },
} as const;

/**
 * Типы маркеров ссылок
 */
export type LinkMarkerType = keyof typeof LINK_MARKERS;

/**
 * Конфигурация ссылки для парсинга
 */
export interface LinkConfig {
  /** URL ссылки */
  href: string;
  /** Открывать в новой вкладке */
  target?: '_blank' | '_self';
  /** Атрибут rel для безопасности */
  rel?: string;
  /** CSS классы для стилизации */
  className?: string;
}

/**
 * Карта маркеров к конфигурации ссылок
 */
export type LinkMarkersMap = Record<string, LinkConfig>;

// ============================================================================
// УТИЛИТЫ ПАРСИНГА
// ============================================================================

/**
 * Создает регулярное выражение для поиска всех маркеров ссылок
 * @param markers - Объект с маркерами для поиска
 * @returns Регулярное выражение для split операции
 */
export function createLinkMarkersRegex(markers: typeof LINK_MARKERS): RegExp {
  const patterns = Object.values(markers).map(
    ({ start, end }) => `(${escapeRegex(start)}.*?${escapeRegex(end)})`
  );

  // eslint-disable-next-line security/detect-non-literal-regexp
  return new RegExp(patterns.join('|'), 'g');
}

/**
 * Экранирует специальные символы для регулярного выражения
 * @param str - Строка для экранирования
 * @returns Экранированная строка
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Извлекает тип маркера и текст ссылки из части строки
 * @param part - Часть строки с маркерами
 * @param markers - Объект с маркерами
 * @returns Информация о ссылке или null
 */
export function extractLinkInfo(
  part: string,
  markers: typeof LINK_MARKERS = LINK_MARKERS
): { type: string; text: string } | null {
  // Проверяем что part это строка
  if (typeof part !== 'string') {
    return null;
  }

  for (const [type, { start, end }] of Object.entries(markers)) {
    if (part.startsWith(start) && part.endsWith(end)) {
      const text = part.replace(start, '').replace(end, '');
      return { type: type.toLowerCase(), text };
    }
  }
  return null;
}

// ============================================================================
// REACT КОМПОНЕНТЫ
// ============================================================================

/**
 * Пропсы для LinkWrapper компонента
 */
export interface LinkWrapperProps {
  href: string;
  children: React.ReactNode;
  target?: '_blank' | '_self';
  rel?: string;
  className?: string;
}

/**
 * Базовый wrapper для ссылок - может быть переопределен в проектах
 * @param props - Пропсы ссылки
 * @returns JSX элемент ссылки
 */
export function DefaultLinkWrapper({
  href,
  children,
  target = '_blank',
  rel = EXTERNAL_LINK_REL,
  className = DEFAULT_LINK_CLASSES,
}: LinkWrapperProps): React.ReactElement {
  return React.createElement('a', { href, target, rel, className }, children);
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ ПАРСИНГА
// ============================================================================

/**
 * Парсит текст с маркерами ссылок и возвращает массив React элементов
 *
 * @param text - Текст с маркерами ссылок
 * @param linkMap - Карта маркеров к конфигурации ссылок
 * @param LinkComponent - Компонент для рендеринга ссылок (по умолчанию DefaultLinkWrapper)
 * @param markers - Маркеры для парсинга (по умолчанию LINK_MARKERS)
 * @returns Массив React элементов
 *
 * @example
 * ```tsx
 * const linkMap = {
 *   rules: { href: '/rules', target: '_blank' },
 *   aml: { href: '/aml-policy', target: '_blank' }
 * };
 *
 * const text = "I agree to [LINK_RULES_START]Terms[LINK_RULES_END] and [LINK_AML_START]AML Policy[LINK_AML_END]";
 * const elements = parseLinkText(text, linkMap);
 * ```
 */
export function parseLinkText(
  text: string,
  linkMap: LinkMarkersMap,
  LinkComponent: React.ComponentType<LinkWrapperProps> = DefaultLinkWrapper,
  markers: typeof LINK_MARKERS = LINK_MARKERS
): React.ReactNode[] {
  // Создаем регулярное выражение для всех маркеров
  const regex = createLinkMarkersRegex(markers);

  // Разбиваем текст на части
  const parts = text.split(regex);

  return parts
    .filter(part => part !== '') // Убираем пустые строки
    .map((part, index) => {
      // Если часть не содержит маркеров - возвращаем как есть
      const linkInfo = extractLinkInfo(part, markers);
      if (!linkInfo) {
        return part;
      }

      // Получаем конфигурацию ссылки
      const linkConfig = linkMap[linkInfo.type];
      if (!linkConfig) {
        // Если конфигурация не найдена - возвращаем просто текст
        return linkInfo.text;
      }

      // Создаем ссылку с помощью переданного компонента
      return React.createElement(LinkComponent, {
        key: index,
        href: linkConfig.href,
        target: linkConfig.target,
        rel: linkConfig.rel,
        className: linkConfig.className,
        children: linkInfo.text, // children передается в props
      });
    });
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Валидирует корректность маркеров в тексте
 * @param text - Текст для валидации
 * @param markers - Маркеры для проверки
 * @returns Массив ошибок валидации
 */
export function validateLinkMarkers(
  text: string,
  markers: typeof LINK_MARKERS = LINK_MARKERS
): string[] {
  const errors: string[] = [];

  for (const [type, { start, end }] of Object.entries(markers)) {
    // eslint-disable-next-line security/detect-non-literal-regexp
    const startCount = (text.match(new RegExp(escapeRegex(start), 'g')) || []).length;
    // eslint-disable-next-line security/detect-non-literal-regexp
    const endCount = (text.match(new RegExp(escapeRegex(end), 'g')) || []).length;

    if (startCount !== endCount) {
      errors.push(`Mismatched ${type} markers: ${startCount} start, ${endCount} end`);
    }
  }

  return errors;
}

/**
 * Создает стандартную карту ссылок для правовых страниц
 * @param routes - Объект с маршрутами
 * @returns Карта ссылок
 */
export function createLegalLinksMap(routes: {
  RULES: string;
  AML_POLICY: string;
  PRIVACY?: string;
  RETURNS?: string;
}): LinkMarkersMap {
  return {
    rules: {
      href: routes.RULES,
      target: '_blank',
      rel: EXTERNAL_LINK_REL,
      className: DEFAULT_LINK_CLASSES,
    },
    aml: {
      href: routes.AML_POLICY,
      target: '_blank',
      rel: EXTERNAL_LINK_REL,
      className: DEFAULT_LINK_CLASSES,
    },
    ...(routes.PRIVACY && {
      privacy: {
        href: routes.PRIVACY,
        target: '_blank',
        rel: EXTERNAL_LINK_REL,
        className: DEFAULT_LINK_CLASSES,
      },
    }),
    ...(routes.RETURNS && {
      returns: {
        href: routes.RETURNS,
        target: '_blank',
        rel: EXTERNAL_LINK_REL,
        className: DEFAULT_LINK_CLASSES,
      },
    }),
  };
}
