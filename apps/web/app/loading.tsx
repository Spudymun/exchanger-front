import { I18N_CONFIG } from '@repo/constants';
import { Spinner, CenteredPageLayout } from '@repo/ui';
import { headers } from 'next/headers';

export default async function GlobalLoading() {
  try {
    // Получаем локаль из middleware header или дефолтную
    const headersList = await headers();
    const locale = headersList.get('x-locale') || I18N_CONFIG.DEFAULT_LOCALE;

    // Прямая загрузка переводов для серверного компонента
    const messages = await import(`../messages/${locale}/common-ui.json`).then(m => m.default);

    return (
      <CenteredPageLayout maxWidth="sm">
        <Spinner size="xl" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">{messages.common.loading}</h2>
        <p className="text-muted-foreground">{messages.common.loadingDescription}</p>
      </CenteredPageLayout>
    );
  } catch {
    // Fallback на английский если не удалось загрузить локализацию
    return (
      <CenteredPageLayout maxWidth="sm">
        <Spinner size="xl" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
        <p className="text-muted-foreground">Please wait while we load your content</p>
      </CenteredPageLayout>
    );
  }
}
