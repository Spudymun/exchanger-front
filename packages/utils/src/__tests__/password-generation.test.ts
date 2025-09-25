import { VALIDATION_LIMITS } from '@repo/constants';

import { generatePasswordForAutoFlow } from '../password-generation';
import { passwordSchema } from '../validation/schemas-basic';
import { enhancedPasswordSchema } from '../validation/security-enhanced-auth-schemas';

describe('generatePasswordForAutoFlow', () => {
  test('МАТЕМАТИЧЕСКАЯ ГАРАНТИЯ: всегда проходит passwordSchema без проверок', () => {
    // Тестируем многократно для уверенности в инварианте
    for (let i = 0; i < 100; i++) {
      const password = generatePasswordForAutoFlow();

      // ИНВАРИАНТ: passwordSchema.parse() НИКОГДА не должен бросать исключение
      const parseFunction = () => passwordSchema.parse(password);
      expect(parseFunction).not.toThrow();

      // Дублирующая проверка через safeParse для наглядности
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(true);
    }
  });

  test('АРХИТЕКТУРНАЯ ГАРАНТИЯ: соответствие всем требованиям passwordSchema', () => {
    const password = generatePasswordForAutoFlow();

    // Проверяем ТОЧНОЕ соответствие требованиям из schemas-basic.ts
    expect(password.length).toBeGreaterThanOrEqual(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH); // >= 8
    expect(/[A-Z]/.test(password)).toBe(true);  // Заглавная буква ОБЯЗАТЕЛЬНА
    expect(/[a-z]/.test(password)).toBe(true);  // Строчная буква ОБЯЗАТЕЛЬНА
    expect(/[0-9]/.test(password)).toBe(true);  // Цифра ОБЯЗАТЕЛЬНА
    expect(/[^A-Za-z0-9]/.test(password)).toBe(true); // Спецсимвол ОБЯЗАТЕЛЕН
  });

  test('ENHANCED SCHEMA совместимость', () => {
    const password = generatePasswordForAutoFlow();

    // Проверяем что пароль проходит полную цепочку валидации auth форм
    const enhancedResult = enhancedPasswordSchema.safeParse(password);
    expect(enhancedResult.success).toBe(true);
  });

  test('криптографическая уникальность', () => {
    const generatePassword = () => generatePasswordForAutoFlow();
    const passwords = Array.from({ length: 1000 }, generatePassword);
    const uniquePasswords = new Set(passwords);

    // Должны быть все уникальными при криптографической генерации
    expect(uniquePasswords.size).toBe(1000);
  });

  test('МИНИМАЛЬНАЯ ДЛИНА: поддерживает кастомную длину', () => {
    const customLength = 16;
    const password = generatePasswordForAutoFlow(customLength);

    expect(password.length).toBe(customLength);
    
    // Все требования всё равно выполняются
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
    expect(/[^A-Za-z0-9]/.test(password)).toBe(true);
  });

  test('БЕЗОПАСНОСТЬ: использует только безопасные символы', () => {
    const password = generatePasswordForAutoFlow();
    
    // Проверяем что используются только безопасные символы
    const safeChars = /^[a-zA-Z0-9!@#$%^&*]+$/;
    expect(safeChars.test(password)).toBe(true);
    
    // НЕТ опасных символов
    expect(password).not.toMatch(/[<>"'`]/); // XSS опасные символы
    expect(password).not.toMatch(/[\\|;]/);  // Command injection символы
  });
});