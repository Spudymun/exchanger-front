# 💳 HTML Autocomplete для карт - Справочник

## 🎯 Основные поля карты

```tsx
// Номер карты (уже добавлено)
<Input
  autoComplete="cc-number"
  name="cardNumber"
  inputMode="numeric"
/>

// CVC/CVV код
<Input
  autoComplete="cc-csc"
  name="cvc"
  inputMode="numeric"
  maxLength="4"
/>

// Месяц истечения
<Select autoComplete="cc-exp-month" name="expMonth">
  <option value="01">01</option>
  <option value="02">02</option>
  ...
</Select>

// Год истечения
<Select autoComplete="cc-exp-year" name="expYear">
  <option value="2024">2024</option>
  <option value="2025">2025</option>
  ...
</Select>

// Или срок истечения одним полем
<Input
  autoComplete="cc-exp"
  name="expiry"
  placeholder="MM/YY"
  inputMode="numeric"
/>

// Имя на карте
<Input
  autoComplete="cc-name"
  name="cardholderName"
  inputMode="text"
/>
```

## 🔒 Для безопасности

Добавь в form:

```tsx
<form autoComplete="on">{/* Браузер автоматически предложит сохраненные карты */}</form>
```

## 🎨 Для лучшего UX

```tsx
// Автоформатирование номера карты
value={cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}

// Автоопределение типа карты
const cardType = getCardBrand(cardNumber); // visa, mastercard, etc.
```

## 📱 Мобильные улучшения

```tsx
// Правильная клавиатура на мобильных
inputMode = 'numeric'; // для номеров
inputMode = 'text'; // для имен
```
