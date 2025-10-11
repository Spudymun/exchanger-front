# План рефакторинга кнопок Telegram бота

**Дата:** 2025-10-11  
**Статус:** 🔴 КРИТИЧЕСКИЙ  
**Автор:** Senior Engineer Analysis

---

## 🔴 Выявленные проблемы

### Проблема №1: Флоу отмены не работает (кнопки не появляются)

**Симптом:**

- Лог показывает: `Cancel order reasons shown`
- Пользователь НЕ видит кнопки выбора причины отмены в Telegram

**Причина (ROOT CAUSE):**

```typescript
// webhook.ts:218-232 - Обработчик cancel_order_
await fetch(
  `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      // ❌ ОТСУТСТВУЕТ message_thread_id для групп с Topics!
      text: `${callbackQuery.message.text}\n\n⚠️ **Выберите причину отмены:**`,
      parse_mode: 'Markdown',
      reply_markup: reasonsKeyboard,
    }),
  }
);
```

**Объяснение:**
В Telegram группах с **Topics** (Форумы), каждое сообщение привязано к топику через `message_thread_id`.
Без этого параметра Telegram Bot API возвращает ошибку, но код **НЕ ПРОВЕРЯЕТ response.ok** и логирует успех.

**Доказательство из существующего кода:**

```typescript
// telegram-api-helpers.ts:54-59 - ПРАВИЛЬНАЯ реализация
if (topicId) {
  urlParams.append('message_thread_id', String(topicId));
}
```

---

### Проблема №2: После отмены флоу "Завершить" пропадает кнопка "Отменить заявку"

**Симптом:**

- Оператор нажимает "Завершить" → появляются 2 кнопки подтверждения
- Оператор нажимает "Отмена" → остаётся ТОЛЬКО кнопка "Завершить"
- Кнопка "Отменить заявку" исчезает

**Причина (ROOT CAUSE):**

```typescript
// webhook.ts:153-166 - Обработчик cancel_complete_
const completeKeyboard = {
  inline_keyboard: [
    [
      {
        text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_COMPLETE,
        callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_COMPLETE_ORDER(orderId),
      },
    ],
    // ❌ ОТСУТСТВУЕТ кнопка "Отменить заявку"!
  ],
};
```

**Ожидаемое поведение:**
После отмены подтверждения должны вернуться **ОБЕ** кнопки:

- ✅ Завершить заявку
- ❌ Отменить заявку

---

### Проблема №3: Отсутствие обработки ошибок Telegram API

**Симптом:**

- Логи показывают успех, но пользователь не видит изменений

**Причина:**

```typescript
// ❌ ПЛОХО - нет проверки ответа
await fetch(TELEGRAM_API_URL, { ... });
logger.info('Cancel order reasons shown', { orderId }); // Логируем ДО проверки результата
```

**Правильный подход:**

```typescript
// ✅ ХОРОШО - проверяем результат
const response = await fetch(TELEGRAM_API_URL, { ... });
if (!response.ok) {
  const error = await response.json();
  logger.error('Failed to edit message', { error, orderId });
  // Показываем ошибку оператору через answerCallbackQuery
}
```

---

### Проблема №4: Дублирование кода редактирования сообщений

**Анализ:**
В `webhook.ts` минимум **10 раз** повторяется один и тот же паттерн:

```typescript
await fetch(
  `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: ...,
      message_id: ...,
      // НО без message_thread_id
      text: ...,
      parse_mode: 'Markdown',
      reply_markup: ...,
    }),
  }
);
```

**Проблема:**

- Код не DRY (Don't Repeat Yourself)
- В каждом месте может быть своя ошибка
- Уже есть готовая функция `editTelegramMessage()` в `telegram-api-helpers.ts`!

---

## ✅ Существующее работающее решение

### Функция `editTelegramMessage()` уже реализована!

**Файл:** `apps/telegram-bot/src/lib/telegram-api-helpers.ts`

```typescript
export async function editTelegramMessage(params: EditMessageParams): Promise<boolean> {
  const { chatId, messageId, topicId, text, keyboard } = params;

  // ✅ Правильно формирует URL params
  const urlParams = new URLSearchParams({
    chat_id: chatId,
    message_id: String(messageId),
    text,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard),
  });

  // ✅ Добавляет message_thread_id для групп с Topics
  if (topicId) {
    urlParams.append('message_thread_id', String(topicId));
  }

  // ✅ Проверяет response.ok
  if (!response.ok) {
    const errorData = await response.json();
    logger.warn('Telegram API returned error', { ... });
    return false;
  }

  return true;
}
```

**Преимущества:**

- ✅ Поддерживает Topics (`message_thread_id`)
- ✅ Обрабатывает ошибки Telegram API
- ✅ Логирует проблемы
- ✅ Единая точка изменения

---

## 📋 План рефакторинга

### Этап 1: Получение topicId из callbackQuery ⚠️ КРИТИЧНО

**Задача:** Определить, как получить `topicId` из `callbackQuery.message`

**Варианты:**

**Вариант A: Из callbackQuery.message напрямую**

```typescript
const topicId = callbackQuery.message.message_thread_id;
```

**Вариант Б: Из базы данных**

```typescript
const prisma = getConfiguredPrismaClient();
const orderMessage = await prisma.telegramOrderMessage.findFirst({
  where: {
    orderId,
    messageId: BigInt(callbackQuery.message.message_id),
  },
});
const topicId = orderMessage?.topicId;
```

**Решение:**

1. Сначала проверить `callbackQuery.message.message_thread_id` (если есть в типах)
2. Если нет - использовать БД как fallback

---

### Этап 2: Рефакторинг cancel*order* handler (строки 202-247)

**Было:**

```typescript
await fetch(
  `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
  { ... }
);
```

**Будет:**

```typescript
import { editTelegramMessage } from '../../src/lib/telegram-api-helpers';

const topicId = callbackQuery.message.message_thread_id;
const success = await editTelegramMessage({
  chatId: String(callbackQuery.message.chat.id),
  messageId: BigInt(callbackQuery.message.message_id),
  topicId,
  text: `${callbackQuery.message.text}\n\n⚠️ **Выберите причину отмены:**`,
  keyboard: reasonsKeyboard,
});

if (!success) {
  await fetch(
    `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: '❌ Не удалось обновить сообщение',
        show_alert: true,
      }),
    }
  );
  return;
}
```

---

### Этап 3: Рефакторинг cancel*complete* handler (строки 148-198)

**Проблема:** Возвращается только кнопка "Завершить", нужны ОБЕ кнопки

**Было:**

```typescript
const completeKeyboard = {
  inline_keyboard: [
    [
      {
        text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_COMPLETE,
        callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_COMPLETE_ORDER(orderId),
      },
    ],
  ],
};
```

**Будет:**

```typescript
const orderKeyboard = {
  inline_keyboard: [
    [
      {
        text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_COMPLETE,
        callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_COMPLETE_ORDER(orderId),
      },
    ],
    [
      {
        text: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.BUTTON_CANCEL_ORDER,
        callback_data: TELEGRAM_OPERATOR_MESSAGES.ACTIONS.CALLBACK_CANCEL_ORDER(orderId),
      },
    ],
  ],
};
```

**И использовать `editTelegramMessage()`:**

```typescript
const topicId = callbackQuery.message.message_thread_id;
const success = await editTelegramMessage({
  chatId: String(callbackQuery.message.chat.id),
  messageId: BigInt(callbackQuery.message.message_id),
  topicId,
  text: originalText,
  keyboard: orderKeyboard,
});
```

---

### Этап 4: Рефакторинг всех остальных handlers

**Применить тот же паттерн к:**

1. `complete_order_` (строки 111-147)
2. `select_cancel_reason_` (строки 250-305)
3. `back_to_order_` (строки 307-357)

**Единый паттерн:**

```typescript
const topicId = callbackQuery.message.message_thread_id;
const success = await editTelegramMessage({
  chatId: String(callbackQuery.message.chat.id),
  messageId: BigInt(callbackQuery.message.message_id),
  topicId,
  text: messageText,
  keyboard: keyboardMarkup,
});

if (!success) {
  // Показываем ошибку оператору
  await answerCallbackQueryWithError(callbackQuery.id, 'Не удалось обновить сообщение');
  return;
}

// Показываем уведомление об успехе
await fetch(
  `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQuery.id,
      text: successMessage, // опционально
    }),
  }
);
```

---

### Этап 5: Извлечение общей логики (DRY)

**Проблема:**
Каждый handler дублирует код для:

1. Извлечения orderId из callback_data
2. Получения topicId
3. Отправки answerCallbackQuery

**Решение:** Создать helper функции в `webhook.ts`:

```typescript
/**
 * Обновить сообщение Telegram с обработкой ошибок
 */
async function updateOrderMessage(
  callbackQuery: NonNullable<TelegramUpdate['callback_query']>,
  text: string,
  keyboard: InlineKeyboard
): Promise<boolean> {
  const topicId = callbackQuery.message?.message_thread_id;

  const success = await editTelegramMessage({
    chatId: String(callbackQuery.message!.chat.id),
    messageId: BigInt(callbackQuery.message!.message_id),
    topicId,
    text,
    keyboard,
  });

  if (!success) {
    await answerCallbackQuery(callbackQuery.id, '❌ Не удалось обновить сообщение', true);
  }

  return success;
}

/**
 * Ответить на callback query
 */
async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<void> {
  await fetch(
    `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.ANSWER_CALLBACK_QUERY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    }
  );
}
```

**Использование:**

```typescript
// Было: 20 строк кода
await fetch(...);
await fetch(...);
logger.info(...);

// Стало: 5 строк
const success = await updateOrderMessage(callbackQuery, newText, keyboard);
if (success) {
  await answerCallbackQuery(callbackQuery.id, '✅ Готово');
  logger.info('Cancel order reasons shown', { orderId });
}
```

---

## 🎯 Приоритеты выполнения

### 🔴 P0 - КРИТИЧНО (исправить немедленно)

1. **Этап 1**: Получение topicId из callbackQuery
2. **Этап 2**: Рефакторинг `cancel_order_` с использованием `editTelegramMessage()`
3. **Этап 3**: Исправление `cancel_complete_` (добавить обе кнопки)

### 🟡 P1 - ВЫСОКИЙ (исправить в ближайшее время)

4. **Этап 4**: Рефакторинг остальных handlers (`complete_order_`, `select_cancel_reason_`, `back_to_order_`)

### 🟢 P2 - СРЕДНИЙ (улучшение качества кода)

5. **Этап 5**: Извлечение общих helper функций (DRY)

---

## 📊 Метрики успеха

### Тестирование после рефакторинга:

**Сценарий 1: Полный флоу отмены**

1. ✅ Нажать "❌ Отменить заявку"
2. ✅ Увидеть 6 причин отмены + кнопка "Назад"
3. ✅ Выбрать причину → увидеть подтверждение
4. ✅ Подтвердить → заявка отменена, кнопки убраны

**Сценарий 2: Флоу отмены с возвратом**

1. ✅ Нажать "❌ Отменить заявку"
2. ✅ Нажать "Назад"
3. ✅ Увидеть **ОБЕ** кнопки: "Завершить" и "Отменить"

**Сценарий 3: Флоу завершения с отменой**

1. ✅ Нажать "✅ Завершить заявку"
2. ✅ Увидеть подтверждение (2 кнопки)
3. ✅ Нажать "Отмена"
4. ✅ Увидеть **ОБЕ** кнопки: "Завершить" и "Отменить"

**Сценарий 4: Обработка ошибок**

1. ✅ При ошибке Telegram API оператор видит сообщение об ошибке
2. ✅ В логах появляется подробная информация об ошибке

---

## 🔍 Сравнение ДО и ПОСЛЕ

### ДО рефакторинга:

```typescript
// ❌ Код дублируется 10 раз
// ❌ Нет message_thread_id → не работает в Topics
// ❌ Нет обработки ошибок → silent failure
// ❌ После cancel_complete_ пропадает кнопка отмены
await fetch(
  `${TELEGRAM_API.BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}${TELEGRAM_API.EDIT_MESSAGE}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      text: newText,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }),
  }
);
logger.info('Success'); // ЛОЖНО - может быть ошибка!
```

### ПОСЛЕ рефакторинга:

```typescript
// ✅ Переиспользование готовой функции
// ✅ Поддержка Topics через message_thread_id
// ✅ Обработка ошибок → показываем оператору
// ✅ Все кнопки возвращаются корректно
const success = await updateOrderMessage(callbackQuery, newText, keyboard);

if (success) {
  await answerCallbackQuery(callbackQuery.id, '✅ Готово');
  logger.info('Success', { orderId }); // ТОЧНО - проверили response
} else {
  logger.error('Failed to update message', { orderId });
}
```

---

## 📝 Чек-лист выполнения

### Перед началом:

- [ ] Создать feature branch: `fix/telegram-buttons-refactoring`
- [ ] Убедиться что `npm run dev` запущен

### Этап 1 (P0):

- [ ] Изучить типы TypeScript для `callbackQuery.message.message_thread_id`
- [ ] Если типа нет - добавить в `types.ts`
- [ ] Проверить что `message_thread_id` действительно приходит в callback

### Этап 2 (P0):

- [ ] Импортировать `editTelegramMessage` в `webhook.ts`
- [ ] Рефакторить обработчик `cancel_order_`
- [ ] Добавить обработку ошибок
- [ ] Протестировать: нажать "Отменить заявку" → увидеть причины

### Этап 3 (P0):

- [ ] Рефакторить обработчик `cancel_complete_`
- [ ] Добавить кнопку "Отменить заявку" в возвращаемый keyboard
- [ ] Протестировать: Завершить → Отмена → видны ОБЕ кнопки

### Этап 4 (P1):

- [ ] Рефакторить `complete_order_`
- [ ] Рефакторить `select_cancel_reason_`
- [ ] Рефакторить `back_to_order_`
- [ ] Протестировать все флоу

### Этап 5 (P2):

- [ ] Создать `updateOrderMessage()` helper
- [ ] Создать `answerCallbackQuery()` helper
- [ ] Заменить дублирующийся код на helpers
- [ ] Проверить что все тесты проходят

### Финальная проверка:

- [ ] Пройти все 4 тестовых сценария
- [ ] Проверить логи - нет ошибок Telegram API
- [ ] Проверить что кнопки всегда корректные
- [ ] Code review с фокусом на DRY

---

## 🚀 Следующие шаги

1. **Прочитать этот план полностью**
2. **Начать с Этапа 1 (P0)** - получение topicId
3. **Тестировать после КАЖДОГО этапа** - не делать всё сразу
4. **Коммитить маленькими частями** - по одному handler за раз
5. **Обновлять этот документ** по мере выполнения (отмечать галочки)

---

## 📚 Ссылки на код

- `apps/telegram-bot/pages/api/webhook.ts` - файл для рефакторинга
- `apps/telegram-bot/src/lib/telegram-api-helpers.ts` - готовая функция `editTelegramMessage()`
- `apps/telegram-bot/src/lib/telegram-message-tracker.ts` - пример использования `message_thread_id`
- `packages/constants/src/telegram.ts` - константы кнопок

---

**Время оценки:** 2-4 часа работы  
**Приоритет:** 🔴 КРИТИЧЕСКИЙ - блокирует работу операторов  
**Риски:** Низкие - используем уже проверенную функцию `editTelegramMessage()`
