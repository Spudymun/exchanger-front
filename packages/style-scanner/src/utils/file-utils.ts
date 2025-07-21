/**
 * File System Utils
 * Утилиты для работы с файловой системой (≤50 строк, сложность ≤10)
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import fg from 'fast-glob';

import { EXCLUDE_PATTERNS } from '../constants/index.js';

/**
 * Поиск файлов по паттерну с исключениями
 */
export async function findFiles(pattern: string, baseDir = process.cwd()): Promise<string[]> {
  try {
    return await fg(pattern, {
      cwd: baseDir,
      ignore: [...EXCLUDE_PATTERNS],
      absolute: true,
    });
  } catch (error) {
    throw new Error(`Failed to find files: ${error}`);
  }
}

/**
 * Безопасное чтение файла
 */
export async function readFileSafely(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Безопасная запись файла с созданием директорий
 */
export async function writeFileSafely(filePath: string, content: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

/**
 * Проверка существования файла
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
