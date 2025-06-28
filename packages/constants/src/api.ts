/**
 * API related constants
 */

export const API_ENDPOINTS = {
    // User management
    USERS: '/api/users',
    USER_PROFILE: '/api/users/profile',
    USER_SETTINGS: '/api/users/settings',

    // Authentication
    AUTH_LOGIN: '/api/auth/login',
    AUTH_LOGOUT: '/api/auth/logout',
    AUTH_REGISTER: '/api/auth/register',
    AUTH_REFRESH: '/api/auth/refresh',

    // Exchange related
    EXCHANGES: '/api/exchanges',
    EXCHANGE_RATES: '/api/exchanges/rates',
    EXCHANGE_HISTORY: '/api/exchanges/history',

    // Trading
    ORDERS: '/api/orders',
    PORTFOLIO: '/api/portfolio',
    TRANSACTIONS: '/api/transactions',
} as const

export const HTTP_STATUS = {
    // Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // Client errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // Server errors
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
} as const

export const API_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
} as const

export const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
} as const

// Type exports for better type safety
export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS]
export type ApiMethod = typeof API_METHODS[keyof typeof API_METHODS]
export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES]
