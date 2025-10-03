function luhnCheck(num) {
  const digits = num.toString().split('').map(Number);
  let sum = 0;
  for (let i = digits.length - 2; i >= 0; i -= 2) {
    let doubled = digits[i] * 2;
    if (doubled > 9) doubled -= 9;
    digits[i] = doubled;
  }
  sum = digits.reduce((a, b) => a + b, 0);
  return sum % 10 === 0;
}

function generateLuhnValidCard(prefix) {
  // Генерируем 15 цифр (prefix + рандомные цифры)
  let partial = prefix;
  while (partial.length < 15) {
    partial += Math.floor(Math.random() * 10).toString();
  }
  
  // Вычисляем контрольную цифру по алгоритму Луна
  const digits = partial.split('').map(Number);
  let sum = 0;
  
  for (let i = digits.length - 1; i >= 0; i -= 2) {
    let doubled = digits[i] * 2;
    if (doubled > 9) doubled -= 9;
    sum += doubled;
  }
  
  for (let i = digits.length - 2; i >= 0; i -= 2) {
    sum += digits[i];
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return partial + checkDigit.toString();
}

// Генерируем валидные карты украинских банков
const bankPrefixes = [
  '516874', // ПриватБанк Mastercard
  '414949', // ПриватБанк Visa
  '536354', // Монобанк Mastercard  
  '473118', // ПУМБ Visa
  '558014', // Райффайзен Mastercard
  '414962', // Ощадбанк Visa
  '540472', // УкрСиббанк Mastercard
  '455231', // Альфа-Банк Visa
  '516874', // ПриватБанк Mastercard #2
  '473118'  // ПУМБ Visa #2
];

console.log('=== ГЕНЕРАЦИЯ ВАЛИДНЫХ КАРТ ===');
const validCards = bankPrefixes.map((prefix, index) => {
  const card = generateLuhnValidCard(prefix);
  console.log(`${index + 1}. ${card}: ${luhnCheck(card) ? 'VALID' : 'INVALID'}`);
  return card;
});

console.log('\n=== МАССИВ ДЛЯ КОДА ===');
console.log('const validCards = [');
for (const card of validCards) console.log(`  '${card}',`);
console.log('];');