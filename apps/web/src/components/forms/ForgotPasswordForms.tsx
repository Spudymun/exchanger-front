'use client';

import React from 'react';

import { ConfirmResetForm } from './ConfirmResetForm';
import { RequestResetForm } from './RequestResetForm';

interface ForgotPasswordFormsProps {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

type ForgotPasswordStep = 'request' | 'confirm';

/**
 * Forgot Password Forms Container
 *
 * Управляет переключением между шагами:
 * 1. Request reset code (email)
 * 2. Confirm reset (email + code + new password)
 *
 * НЕ использует AuthFormLayout (он только для login/register toggle)
 * Простой линейный flow: request → confirm → success (auto-login)
 */
export const ForgotPasswordForms = React.memo<ForgotPasswordFormsProps>(
  ({ onSuccess, onBackToLogin }) => {
    const [step, setStep] = React.useState<ForgotPasswordStep>('request');
    const [email, setEmail] = React.useState<string>('');

    // Success handler для request step
    const handleRequestSuccess = React.useCallback((submittedEmail: string) => {
      setEmail(submittedEmail);
      setStep('confirm');
    }, []);

    // Back to request handler (resend code)
    const handleBackToRequest = React.useCallback(() => {
      setStep('request');
    }, []);

    return (
      <div className="forgot-password-forms-container">
        {step === 'request' && (
          <RequestResetForm onSuccess={handleRequestSuccess} onBackToLogin={onBackToLogin} />
        )}

        {step === 'confirm' && (
          <ConfirmResetForm
            email={email}
            onSuccess={onSuccess}
            onBackToRequest={handleBackToRequest}
          />
        )}
      </div>
    );
  }
);

ForgotPasswordForms.displayName = 'ForgotPasswordForms';
