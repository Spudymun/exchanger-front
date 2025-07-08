import { SUPPORTED_LOCALES } from '@repo/constants';
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = SUPPORTED_LOCALES;

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as (typeof locales)[number])) notFound();

  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
