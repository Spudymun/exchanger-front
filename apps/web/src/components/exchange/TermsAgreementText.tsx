import { LEGAL_ROUTES } from '@repo/constants';
import { parseLinkText, createLegalLinksMap } from '@repo/utils';

import { Link } from '../../i18n/navigation';

interface TermsAgreementTextProps {
  t: (key: string) => string;
}

/**
 * Wrapper компонент для next-intl Link
 * Адаптирует наш Link для использования с централизованной утилитой парсинга
 */
function NextIntlLinkWrapper({
  href,
  children,
  target,
  rel,
  className,
}: {
  href: string;
  children: React.ReactNode;
  target?: '_blank' | '_self';
  rel?: string;
  className?: string;
}) {
  return (
    <Link href={href} target={target} rel={rel} className={className}>
      {children}
    </Link>
  );
}

/**
 * Terms Agreement Text Component with Links using centralized link parsing
 * Использует централизованную утилиту для парсинга ссылок в переводах
 */
export function TermsAgreementText({ t }: TermsAgreementTextProps) {
  const agreementText = t('security.terms.agreement');

  // Создаем карту ссылок для правовых страниц
  const linkMap = createLegalLinksMap(LEGAL_ROUTES);

  // Парсим текст с маркерами ссылок используя централизованную утилиту
  const elements = parseLinkText(agreementText, linkMap, NextIntlLinkWrapper);

  return <>{elements}</>;
}
