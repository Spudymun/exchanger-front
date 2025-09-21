# Gmail SMTP Provider Usage Guide

## Overview

Gmail SMTP Provider добавлен в EmailServiceFactory для бесплатной отправки email через Gmail SMTP.

## Environment Variables Setup

### Required Variables

Добавьте в ваш `.env` файл:

```env
# Gmail SMTP Provider (for production email sending)
# Create App Password: https://support.google.com/accounts/answer/185833
GMAIL_SMTP_USER=your-gmail@gmail.com
GMAIL_SMTP_PASS=your-app-password

# Optional: Custom from address
SMTP_FROM=noreply@yourcompany.com
```

### Environment Detection

Provider автоматически создается из environment variables:

```typescript
import { GmailSmtpEmailProvider } from '@repo/email-service';

// Автоматическое создание из environment variables
const provider = GmailSmtpEmailProvider.createFromEnvironment();

if (provider) {
  // Gmail SMTP настроен и готов к использованию
  await provider.send(emailMessage);
} else {
  // Gmail SMTP не настроен - переменные отсутствуют
  console.log('Gmail SMTP not configured');
}
```

### Fallback Behavior

При отсутствии environment variables:

- `createFromEnvironment()` возвращает `null`
- Логируется debug информация о причине fallback
- EmailServiceFactory может использовать другие провайдеры

## Manual Configuration

Для ручной настройки (не рекомендуется для production):

```typescript
import { EmailServiceFactory } from '@repo/email-service';

// Создание Gmail SMTP provider
const gmailProvider = EmailServiceFactory.create({
  provider: 'gmail',
  apiKey: 'your-gmail-app-password', // App Password из Google Account
  fromEmail: 'your-email@gmail.com',
  fromName: 'Your Company Name',
});

// Отправка email
const result = await gmailProvider.send({
  to: 'recipient@example.com',
  subject: 'Test Email',
  html: '<h1>Hello from Gmail SMTP!</h1>',
  text: 'Hello from Gmail SMTP!',
});
```

## Gmail App Password Setup

1. **Включите 2FA** в Google Account
2. **Создайте App Password**:
   - Перейдите в [Google Account Security](https://myaccount.google.com/security)
   - App passwords → Select app → Mail → Generate
   - Используйте сгенерированный 16-символьный пароль как `GMAIL_SMTP_PASS`

## Troubleshooting

### Environment Variables Not Loading

```bash
# Проверьте загрузку переменных
node -e "console.log('GMAIL_SMTP_USER:', process.env.GMAIL_SMTP_USER ? 'loaded' : 'missing')"
```

### Турбо Cache Issues

Если изменения в `.env` не применяются:

```bash
# Очистите турбо кеш
npx turbo clean
npm run dev
```

Убедитесь что переменные добавлены в `turbo.json`:

```json
{
  "tasks": {
    "dev": {
      "env": ["GMAIL_SMTP_USER", "GMAIL_SMTP_PASS", "SMTP_FROM"]
    }
  }
}
```

## Requirements

1. **Google Account** с включенной двухфакторной аутентификацией
2. **App Password** - создается в Google Account Settings → Security → App passwords
3. **Environment Variables** настроены в `.env` файле

## Limits

- **500 emails per day** для обычных Gmail аккаунтов
- **Rate limiting** реализован через RateLimitedEmailService

## Integration

Gmail SMTP Provider полностью интегрирован в существующую архитектуру EmailServiceFactory и совместим со всеми существующими сервисами.
