/**
 * Environment variables validation schema
 * Add your environment variables here for validation
 */

// Required environment variables for production
export const requiredEnvVars = [
    // 'DATABASE_URL',
    // 'API_KEY', 
    // 'JWT_SECRET'
] as const;

// Optional environment variables with defaults
export const optionalEnvVars = {
    PORT: '3000',
    NODE_ENV: 'development',
    VERCEL_URL: undefined,
    CI: undefined,
    PLAYWRIGHT_TEST_BASE_URL: undefined,
} as const;

// Type definitions for environment variables
export type RequiredEnvVar = (typeof requiredEnvVars)[number];
export type OptionalEnvVar = keyof typeof optionalEnvVars;
export type EnvVar = RequiredEnvVar | OptionalEnvVar;

/**
 * Validate that all required environment variables are present
 */
export function validateEnvVars() {
    const missing = requiredEnvVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env file or environment configuration.'
        );
    }
}

/**
 * Get environment variable with type safety
 */
export function getEnvVar(key: RequiredEnvVar): string;
export function getEnvVar<T extends OptionalEnvVar>(
    key: T,
    defaultValue?: string
): string | undefined;
export function getEnvVar(key: EnvVar, defaultValue?: string): string | undefined {
    return process.env[key] ?? defaultValue ?? optionalEnvVars[key as OptionalEnvVar];
}
