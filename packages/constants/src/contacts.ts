/**
 * Контактная информация и социальные сети для обменника криптовалют ExchangeGO
 */

export const SOCIAL_LINKS = {
  TELEGRAM: {
    name: 'Telegram',
    href: 'https://t.me/exchangego_official',
    icon: 'telegram',
  },
  TWITTER: {
    name: 'Twitter',
    href: 'https://twitter.com/exchangego_official',
    icon: 'twitter',
  },
  SUPPORT_TELEGRAM: {
    name: 'Telegram Support',
    href: 'https://t.me/exchangego_support',
    icon: 'telegram',
  },
} as const;

export const CONTACT_INFO = {
  SUPPORT_EMAIL: 'support@exchangego.com',
  SUPPORT_TELEGRAM: '@exchangego_support',
  WORKING_HOURS: '24/7',
  RESPONSE_TIME: '5-15 минут',
} as const;

export const COMPANY_INFO = {
  NAME: 'ExchangeGO',
  DESCRIPTION: 'Быстрый и безопасный обмен криптовалют на фиатные деньги',
  ESTABLISHED: '2024',
  SERVICE_TYPE: 'Автоматический обменник криптовалют',
} as const;

export const FOOTER_SECTIONS = {
  EXCHANGE: 'exchange',
  SUPPORT: 'support',
  LEGAL: 'legal',
  CONTACTS: 'contacts',
} as const;

export type SocialLinkKey = keyof typeof SOCIAL_LINKS;
export type FooterSectionKey = keyof typeof FOOTER_SECTIONS;
