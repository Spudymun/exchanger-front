import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GlobalNotFound() {
  // Get locale from middleware header
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'en';

  // Redirect to localized not-found page
  redirect(`/${locale}/not-found-page`);
}
