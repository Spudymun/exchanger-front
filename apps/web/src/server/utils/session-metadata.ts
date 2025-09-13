import type { IncomingHttpHeaders } from 'node:http';

/**
 * Helper function to safely get user agent from request headers
 */
function getUserAgent(headers: IncomingHttpHeaders): string | undefined {
  const userAgent = headers['user-agent'];
  return typeof userAgent === 'string' ? userAgent : undefined;
}

/**
 * Creates session metadata object for session creation
 *
 * @param ip - Client IP address from request context
 * @param headers - Request headers for user agent extraction
 * @returns Session metadata object with ip and userAgent
 */
export function createSessionMetadata(
  ip: string | undefined,
  headers: IncomingHttpHeaders
): { ip: string; userAgent?: string } {
  return {
    ip: ip || '0.0.0.0', // Ensure ip is never undefined
    userAgent: getUserAgent(headers),
  };
}
