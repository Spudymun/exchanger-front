import { LEGAL_ROUTES } from '@repo/constants';

import { Link } from '../../i18n/navigation';

interface TermsAgreementTextProps {
  t: (key: string) => string;
}

// Terms Agreement Text Component with Links according to project architecture
export function TermsAgreementText({ t }: TermsAgreementTextProps) {
  const agreementText = t('security.terms.agreement');
  
  // Parse the text and replace link markers with actual Link components
  const parts = agreementText.split(/(\[LINK_RULES_START\].*?\[LINK_RULES_END\]|\[LINK_AML_START\].*?\[LINK_AML_END\])/);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('[LINK_RULES_START]') && part.endsWith('[LINK_RULES_END]')) {
          const linkText = part.replace('[LINK_RULES_START]', '').replace('[LINK_RULES_END]', '');
          return (
            <Link 
              key={index} 
              href={LEGAL_ROUTES.RULES} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {linkText}
            </Link>
          );
        }
        
        if (part.startsWith('[LINK_AML_START]') && part.endsWith('[LINK_AML_END]')) {
          const linkText = part.replace('[LINK_AML_START]', '').replace('[LINK_AML_END]', '');
          return (
            <Link 
              key={index} 
              href={LEGAL_ROUTES.AML_POLICY} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {linkText}
            </Link>
          );
        }
        
        return part;
      })}
    </>
  );
}