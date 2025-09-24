import { AUTH_CONSTANTS } from '@repo/constants';

/**
 * Interface для HTTP response объекта с методом setHeader
 * Совместимо с tRPC context response и NextResponse
 */
interface ResponseWithHeaders {
  setHeader: (name: string, value: string) => void;
}

/**
 * Централизованная утилита для работы с session cookies
 * Устраняет дублирование кода установки cookies между роутерами
 */
export class SessionCookieUtils {
  /**
   * Устанавливает session cookie с стандартными параметрами безопасности
   * 
   * @param res - Response объект для установки заголовков
   * @param sessionId - ID сессии для установки в cookie
   * @param maxAge - Время жизни cookie в секундах (по умолчанию из AUTH_CONSTANTS)
   */
  static setSessionCookie(
    res: ResponseWithHeaders,
    sessionId: string,
    maxAge: number = AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
  ): void {
    const cookieValue = `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    
    res.setHeader(AUTH_CONSTANTS.SET_COOKIE_HEADER, cookieValue);
  }

  /**
   * Очищает session cookie (для logout)
   * 
   * @param res - Response объект для установки заголовков
   */
  static clearSessionCookie(
    res: ResponseWithHeaders
  ): void {
    const cookieValue = `sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
    
    res.setHeader(AUTH_CONSTANTS.SET_COOKIE_HEADER, cookieValue);
  }
}