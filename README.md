Огляд:
Цей скрипт (`swap2.ts`) виконує обмін SOL на wfragSOL через два послідовні свопи в Orca Whirlpools:
1. SOL → JitoSOL
2. JitoSOL → wfragSOL

Використовується бібліотека: `@orca-so/whirlpools-sdk@0.11.x`.

Скрипт бере приватний ключ та інші налаштування з `.env`. Свопи виконуються послідовно у вигляді двох окремих транзакцій (як приклад — транзакція `5HMZ2apdk...`).

Що робить скрипт:
- Конвертує 0.01 SOL в JitoSOL, а потім у wfragSOL.
- Працює з такими пулами Orca:
  - SOL/JitoSOL: `Hp53XEtt4S8SvPCXarsLSdGfZBuUr5mMmZmX2DRNXQKp`
  - JitoSOL/wfragSOL: `5xfKkFmhzNhHKTFUkh4PJmHSWB6LpRvhJcUMKzPP6md2`
- Виводить у консоль суми й ID транзакцій.

Токени:
- SOL/WSOL: `So11111111111111111111111111111111111111112`
- JitoSOL: `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn`
- wfragSOL: `WFRGSWjaz8tbAxsJitmbfRuFV2mSNwy7BMWcCwaA28U`
- Гаманець: `H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt`

Структура скрипта:
- Імпорти: бібліотеки для Solana, Orca, .env
- Константи: адреси токенів, пулів, RPC
- Логіка:
  - Завантажує приватний ключ з `.env`
  - Підключається до мережі Solana через RPC (Helius)
  - Завантажує дані пулів Orca
  - Виконує перший своп: SOL → JitoSOL
  - Виконує другий своп: JitoSOL → wfragSOL
  - Логує суми й посилання на транзакції у Solscan

---

Налаштування проєкту:

1. Установка залежностей
У папці проєкту виконайте:
```bash
npm install @orca-so/whirlpools-sdk@0.11.3 @solana/web3.js @coral-xyz/anchor @orca-so/common-sdk bn.js dotenv ts-node
```

Перевірте версію Whirlpools SDK:
```bash
npm list @orca-so/whirlpools-sdk
```
Повинна бути `0.11.x`.

2. Налаштування змінних середовища
Створіть файл `.env` у корені проєкту зі вмістом:
```env
PRIVATE_KEY=[2,198,66,16,...162,184,19,120,28,81]
```
`PRIVATE_KEY` — приватний ключ гаманця `H4YQr4rZ...`. Щоб створити новий гаманець:
```bash
solana-keygen new
```
Скопіюйте масив байтів з `keypair.json` у `.env`.

---

Налаштування скрипта:

1. Приватний ключ
Повинен бути в `.env` для гаманця `H4YQr4rZ...`. Для іншого — оновіть значення `PRIVATE_KEY`.

2. RPC
Використовується RPC від Helius:
```ts
const RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=0a9c830e-335d-416d-a3cb-cdb534352664";
```

3. Сума SOL
У поточній конфігурації: `0.01 SOL` (на балансі ~0.012 SOL):
```ts
const inputAmount = new BN(Math.floor(0.01 * LAMPORTS_PER_SOL));
```

Для прикладу з транзакції `5HMZ2apdk...` було `0.095602285 SOL`. Якщо не вистачає балансу:
```bash
solana transfer H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt 0.1
```
Після цього змініть у `swap2.ts`:
```ts
const inputAmount = new BN(Math.floor(0.095602285 * LAMPORTS_PER_SOL));
```

---

Запуск скрипта:

1. Перевірка ATA:
Переконайтесь, що існують ATA для WSOL, JitoSOL, wfragSOL:
```bash
spl-token accounts --owner H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt
```
Якщо ні — створіть вручну або зверніться за допомогою.

2. Додайте скрипт до `package.json`:
```json
{
  "scripts": {
    "swap2": "node --loader ts-node/esm swap2.ts"
  }
}
```

3. Запуск:
```bash
npm run swap2
```

---

Очікуваний результат:
```
Wallet: H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt
Перший своп (SOL → JitoSOL)...
Очікуваний вихід JitoSOL: ~0.008
txid (SOL → JitoSOL): <txid>

Другий своп (JitoSOL → wfragSOL)...
Очікуваний вихід wfragSOL: ~0.009
txid (JitoSOL → wfragSOL): <txid>

https://solscan.io/tx/<txid>
```

Перевірка токенів:
```bash
spl-token accounts --owner H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt
```
Транзакції — через [Solscan](https://solscan.io).

---

Труднощі:
- Не вся документація доступна у відкритому доступі.
- Можливі помилки при сумісності між бібліотеками та кодом.

