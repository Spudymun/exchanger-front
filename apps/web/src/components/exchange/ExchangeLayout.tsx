'use client';

import { UseFormReturn } from '@repo/hooks';
import { ExchangeForm } from '@repo/ui';

interface ExchangeLayoutProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
}

// Sending section using Compound Components
function SendingSection({ t }: { t: (key: string) => string }) {
  return (
    <ExchangeForm.ExchangeCard type="sending">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('sending.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('sending.subtitle')}</p>
      </header>

      <div className="send-content space-y-4">
        {/* Currency Selection - будет реализовано в task 2.2 */}
        <div className="currency-selection">
          <div className="placeholder-content h-20 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Currency Selection (Task 2.2)</span>
          </div>
        </div>

        {/* Amount Input - будет реализовано в task 2.2 */}
        <div className="amount-input">
          <div className="placeholder-content h-16 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Amount Input (Task 2.2)</span>
          </div>
        </div>
      </div>
    </ExchangeForm.ExchangeCard>
  );
}

// Receiving section using Compound Components
function ReceivingSection({ t }: { t: (key: string) => string }) {
  return (
    <ExchangeForm.ExchangeCard type="receiving">
      <header className="section-header mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('receiving.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('receiving.subtitle')}</p>
      </header>

      <div className="receive-content space-y-4">
        {/* Bank Selection - будет реализовано в task 2.2 */}
        <div className="bank-selection">
          <div className="placeholder-content h-20 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Bank Selection (Task 2.2)</span>
          </div>
        </div>

        {/* Amount Display - будет реализовано в task 2.2 */}
        <div className="amount-display">
          <div className="placeholder-content h-16 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Amount Display (Task 2.2)</span>
          </div>
        </div>
      </div>
    </ExchangeForm.ExchangeCard>
  );
}

// Additional sections component
function AdditionalSections() {
  return (
    <div className="exchange-additional-sections mt-8 space-y-6">
      {/* Personal Data Section - будет реализовано в task 2.3 */}
      <section className="personal-data-section bg-muted/50 border border-border rounded-lg p-6">
        <header className="section-header mb-6">
          <h2 className="text-xl font-semibold text-foreground">Персональные данные</h2>
        </header>
        <div className="placeholder-content h-24 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Personal Data Form (Task 2.3)</span>
        </div>
      </section>

      {/* Security Section - будет реализовано в task 2.3 */}
      <section className="security-section bg-muted/50 border border-border rounded-lg p-6">
        <header className="section-header mb-6">
          <h2 className="text-xl font-semibold text-foreground">Безопасность</h2>
        </header>
        <div className="placeholder-content h-32 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Security & Verification (Task 2.3)</span>
        </div>
      </section>

      {/* Submit Section - будет реализовано в task 2.4 */}
      <section className="submit-section">
        <div className="placeholder-content h-16 bg-primary/10 border border-dashed border-primary/30 rounded-md flex items-center justify-center">
          <span className="text-sm text-primary">Submit Button & Actions (Task 2.4)</span>
        </div>
      </section>
    </div>
  );
}

export function ExchangeLayout({ form, t }: ExchangeLayoutProps) {
  return (
    <form onSubmit={form.handleSubmit} className="exchange-form">
      {/* Two-Column Layout using Compound Components */}
      <ExchangeForm.CardPair layout="horizontal">
        <SendingSection t={t} />
        <ReceivingSection t={t} />
      </ExchangeForm.CardPair>

      <AdditionalSections />
    </form>
  );
}
