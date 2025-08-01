import { z } from 'zod';

/**
 * Типы для локализованных сообщений Zod ошибок
 */
interface ZodErrorMessages {
  invalid_type: Record<string, string>;
  too_small: Record<string, Record<string, string>>;
  too_big: Record<string, Record<string, string>>;
  invalid_string: Record<string, string>;
  custom: string;
}

/**
 * Локализованные сообщения ошибок для Zod схем
 */
const zodErrorMessages = {
  en: {
    invalid_type: {
      string: 'Expected string, received {received}',
      number: 'Expected number, received {received}',
      boolean: 'Expected boolean, received {received}',
    },
    too_small: {
      string: {
        minimum: 'String must contain at least {minimum} character(s)',
        exact: 'String must contain exactly {minimum} character(s)',
      },
      number: {
        minimum: 'Number must be greater than or equal to {minimum}',
      },
    },
    too_big: {
      string: {
        maximum: 'String must contain at most {maximum} character(s)',
        exact: 'String must contain exactly {maximum} character(s)',
      },
      number: {
        maximum: 'Number must be less than or equal to {maximum}',
      },
    },
    invalid_string: {
      email: 'Invalid email address',
    },
    custom: 'Invalid input',
  },
  ru: {
    invalid_type: {
      string: 'Ожидается строка, получено {received}',
      number: 'Ожидается число, получено {received}',
      boolean: 'Ожидается логическое значение, получено {received}',
    },
    too_small: {
      string: {
        minimum: 'Строка должна содержать минимум {minimum} символ(ов)',
        exact: 'Строка должна содержать ровно {minimum} символ(ов)',
      },
      number: {
        minimum: 'Число должно быть больше или равно {minimum}',
      },
    },
    too_big: {
      string: {
        maximum: 'Строка должна содержать максимум {maximum} символ(ов)',
        exact: 'Строка должна содержать ровно {maximum} символ(ов)',
      },
      number: {
        maximum: 'Число должно быть меньше или равно {maximum}',
      },
    },
    invalid_string: {
      email: 'Неверный адрес электронной почты',
    },
    custom: 'Неверный ввод',
  },
} as const;

/**
 * Заменяет плейсхолдеры в строке сообщения
 */
function interpolateMessage(message: string, params: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      // eslint-disable-next-line security/detect-object-injection
      const value = params[key];
      return value !== undefined ? String(value) : match;
    }
    return match;
  });
}

/**
 * Обрабатывает ошибки invalid_type
 */
function handleInvalidTypeError(
  issue: z.ZodInvalidTypeIssue,
  messages: ZodErrorMessages
): string | null {
  const template = messages.invalid_type[issue.expected];
  if (template) {
    return interpolateMessage(template, {
      received: issue.received,
      expected: issue.expected,
    });
  }
  return null;
}

/**
 * Обрабатывает ошибки too_small
 */
function handleTooSmallError(issue: z.ZodTooSmallIssue, messages: ZodErrorMessages): string | null {
  const typeMessages = messages.too_small[issue.type];
  if (typeMessages) {
    const template = issue.exact ? typeMessages.exact : typeMessages.minimum;
    if (template) {
      return interpolateMessage(template, {
        minimum: Number(issue.minimum),
        type: issue.type,
      });
    }
  }
  return null;
}

/**
 * Обрабатывает ошибки too_big
 */
function handleTooBigError(issue: z.ZodTooBigIssue, messages: ZodErrorMessages): string | null {
  const typeMessages = messages.too_big[issue.type];
  if (typeMessages) {
    const template = issue.exact ? typeMessages.exact : typeMessages.maximum;
    if (template) {
      return interpolateMessage(template, {
        maximum: Number(issue.maximum),
        type: issue.type,
      });
    }
  }
  return null;
}

/**
 * Обрабатывает ошибки invalid_string
 */
function handleInvalidStringError(
  issue: z.ZodInvalidStringIssue,
  messages: ZodErrorMessages
): string | null {
  // issue.validation может быть строкой (например, 'email') или объектом
  const validation = typeof issue.validation === 'string' ? issue.validation : 'email';

  // Безопасный доступ к свойству
  const validationMessages = messages.invalid_string;
  if (validation === 'email' && validationMessages.email) {
    return validationMessages.email;
  }

  return null;
}

/**
 * Validates data against a Zod schema with localized error messages
 */
export function validateFormWithErrorMap<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  locale = 'en'
): z.SafeParseReturnType<unknown, T> {
  const errorMap = createZodErrorMap(locale);
  return schema.safeParse(data, { errorMap });
}

/**
 * Получает сообщения для локали с fallback
 */
function getMessagesForLocale(locale: string): ZodErrorMessages {
  // Безопасная проверка доступных локалей
  const availableLocales = ['en', 'ru'] as const;
  const safeLocale = availableLocales.includes(locale as 'en' | 'ru') ? locale : 'en';

  if (safeLocale === 'ru') {
    return zodErrorMessages.ru;
  }
  return zodErrorMessages.en;
}

/**
 * Создает error map для Zod на основе указанной локали
 */
export function createZodErrorMap(locale: string = 'en'): z.ZodErrorMap {
  const messages = getMessagesForLocale(locale);

  return (issue, ctx) => {
    let customMessage: string | null = null;

    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        customMessage = handleInvalidTypeError(issue, messages);
        break;
      case z.ZodIssueCode.too_small:
        customMessage = handleTooSmallError(issue, messages);
        break;
      case z.ZodIssueCode.too_big:
        customMessage = handleTooBigError(issue, messages);
        break;
      case z.ZodIssueCode.invalid_string:
        customMessage = handleInvalidStringError(issue, messages);
        break;
      case z.ZodIssueCode.custom:
        customMessage = messages.custom;
        break;
    }

    return { message: customMessage || ctx.defaultError };
  };
}

/**
 * Устанавливает глобальный error map для Zod
 */
export function setZodErrorMap(locale: string = 'en'): void {
  z.setErrorMap(createZodErrorMap(locale));
}

/**
 * Получает доступные локали для error map
 */
export function getAvailableLocales(): string[] {
  return Object.keys(zodErrorMessages);
}
