/**
 * Валидационные хелперы
 * Функции для создания схем с параметрами
 */

import { z } from 'zod';

import { idSchema } from './schemas-basic';

// === ВАЛИДАТОРЫ-ХЕЛПЕРЫ ===

/**
 * Создает схему с ограничением по времени (например, для rate limiting)
 */
export function createTimestampSchema() {
  return z.number().int().positive();
}

/**
 * Создает схему для опциональной строки с минимальной длиной
 */
export function createOptionalStringSchema(minLength = 1) {
  return z.string().min(minLength).optional();
}

/**
 * Создает схему для массива ID
 */
export function createIdsArraySchema(maxItems = 100) {
  return z.array(idSchema).max(maxItems);
}

/**
 * Создает схему для диапазона чисел
 */
export function createNumberRangeSchema(min: number, max: number) {
  return z.number().min(min).max(max);
}
