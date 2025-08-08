/**
 * Утилита для имитации задержки в API endpoints
 * Устраняет дублирование кода согласно DRY принципу
 */
export const createDelay = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));