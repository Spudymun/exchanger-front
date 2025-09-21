# Gmail SMTP Provider Usage Guide

## Overview

Gmail SMTP Provider добавлен в EmailServiceFactory для бесплатной отправки email через Gmail SMTP.

## Configuration

Для использования Gmail SMTP Provider:

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

## Requirements

1. **Google Account** с включенной двухфакторной аутентификацией
2. **App Password** - создается в Google Account Settings → Security → App passwords
3. **Environment Variables** (рекомендуется):
   ```env
   GMAIL_APP_PASSWORD=your-16-character-app-password
   GMAIL_FROM_EMAIL=your-email@gmail.com
   GMAIL_FROM_NAME="Your Company Name"
   ```

## Limits

- **500 emails per day** для обычных Gmail аккаунтов
- **Rate limiting** реализован через RateLimitedEmailService

## Integration

Gmail SMTP Provider полностью интегрирован в существующую архитектуру EmailServiceFactory и совместим со всеми существующими сервисами.
