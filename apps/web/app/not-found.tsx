import { I18N_CONFIG } from '@repo/constants';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GlobalNotFound() {
  // Get locale from middleware header with centralized fallback
  const headersList = await headers();
  const locale = headersList.get('x-locale') || I18N_CONFIG.DEFAULT_LOCALE;

  // Redirect to localized not-found page
  redirect(`/${locale}/not-found-page`);
}
