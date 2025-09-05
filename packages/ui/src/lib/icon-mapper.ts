import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Mapping строковых названий иконок в React компоненты
 * Централизованное решение для ORDER_STATUS_CONFIG иконок
 *
 * Исправляет НАРУШЕНИЕ 3.1: Дублирование логики статусов
 * Согласно Rule 20 (Запрет избыточности) и Rule 17 (Централизованные системы)
 */
const ICON_MAPPING = {
  clock: Clock,
  'check-circle': CheckCircle,
  'check-circle-2': CheckCircle, // Альтернативное название для COMPLETED
  loader: Loader2,
  'x-circle': XCircle,
} as const;

/**
 * Получает React компонент иконки по строковому названию
 * Используется с ORDER_STATUS_CONFIG из @repo/constants
 *
 * @param iconName - Название иконки из ORDER_STATUS_CONFIG.icon
 * @returns React компонент иконки или Clock как fallback
 */
export function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAPPING[iconName as keyof typeof ICON_MAPPING] || Clock;
}

/**
 * Получает все доступные названия иконок
 * Для валидации и отладки
 */
export function getAvailableIconNames(): readonly string[] {
  return Object.keys(ICON_MAPPING) as readonly string[];
}
