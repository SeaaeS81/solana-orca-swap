### Overview:

This script (`swap2.ts`) performs a swap from SOL to wfragSOL via two consecutive swaps in Orca Whirlpools:

- SOL → JitoSOL  
- JitoSOL → wfragSOL

It uses the library: `@orca-so/whirlpools-sdk@0.11.x`.

The script retrieves the private key and other configurations from a `.env` file. The swaps are executed sequentially as two separate transactions (see example: transaction `5HMZ2apdk...`).

### What the script does:

- Converts 0.01 SOL to JitoSOL, and then to wfragSOL.
- Uses the following Orca pools:
  - SOL/JitoSOL: `Hp53XEtt4S8SvPCXarsLSdGfZBuUr5mMmZmX2DRNXQKp`
  - JitoSOL/wfragSOL: `5xfKkFmhzNhHKTFUkh4PJmHSWB6LpRvhJcUMKzPP6md2`
- Logs amounts and transaction IDs to the console.

### Tokens:

- SOL/WSOL: `So11111111111111111111111111111111111111112`
- JitoSOL: `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn`
- wfragSOL: `WFRGSWjaz8tbAxsJitmbfRuFV2mSNwy7BMWcCwaA28U`

### Wallet:
`H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt`

---

### Script structure:

**Imports:**  
Libraries for Solana, Orca, `.env`

**Constants:**  
Token addresses, pool addresses, RPC endpoint

**Logic:**
- Loads the private key from `.env`
- Connects to the Solana network via RPC (Helius)
- Loads Orca pool data
- Executes the first swap: SOL → JitoSOL
- Executes the second swap: JitoSOL → wfragSOL
- Logs the amounts and Solscan links for transactions

---

### Project setup:

**Install dependencies:**  
In the project folder, run:

```bash
npm install @orca-so/whirlpools-sdk@0.11.3 @solana/web3.js @coral-xyz/anchor @orca-so/common-sdk bn.js dotenv ts-node
```

**Check the Whirlpools SDK version:**

```bash
npm list @orca-so/whirlpools-sdk
```

It should be version `0.11.x`.

---

### Environment variable configuration:

Create a `.env` file in the root of the project with the content:

```env
PRIVATE_KEY=[2,198,66,16,...162,184,19,120,28,81]
```

**`PRIVATE_KEY`** — is the private key for wallet `H4YQr4rZ...`.  
To create a new wallet:

```bash
solana-keygen new
```

Copy the byte array from `keypair.json` into `.env`.

---

### Script configuration:

**Private Key:**  
Must be in `.env` for wallet `H4YQr4rZ...`. Update the `PRIVATE_KEY` if using another wallet.

**RPC:**  
The script uses Helius RPC:

```ts
const RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=0a9c830e-335d-416d-a3cb-cdb534352664";
```

**Amount of SOL:**  
Currently set to 0.01 SOL (wallet balance should be at least ~0.012 SOL):

```ts
const inputAmount = new BN(Math.floor(0.01 * LAMPORTS_PER_SOL));
```

In the example transaction `5HMZ2apdk...`, the amount was 0.095602285 SOL. If balance is insufficient, transfer more:

```bash
solana transfer H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt 0.1
```

Then update in `swap2.ts`:

```ts
const inputAmount = new BN(Math.floor(0.095602285 * LAMPORTS_PER_SOL));
```

---

### Running the script:

**Check ATA:**  
Ensure the wallet has Associated Token Accounts (ATA) for WSOL, JitoSOL, and wfragSOL:

```bash
spl-token accounts --owner H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt
```

If not — create them manually or seek help.

**Add script to `package.json`:**

```json
{
  "scripts": {
    "swap2": "node --loader ts-node/esm swap2.ts"
  }
}
```

**Run the script:**

```bash
npm run swap2
```

---

### Expected result:

```txt
Wallet: H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt
First swap (SOL → JitoSOL)...
Expected JitoSOL output: ~0.008
txid (SOL → JitoSOL): <txid>

Second swap (JitoSOL → wfragSOL)...
Expected wfragSOL output: ~0.009
txid (JitoSOL → wfragSOL): <txid>
```

View transaction on Solscan:  
`https://solscan.io/tx/<txid>`

**Check tokens:**

```bash
spl-token accounts --owner H4YQr4rZ5csstyptwSzejVX2b11NeYaHiXmn8fFJKGEt
```

Transactions can be verified via Solscan.

---

### Challenges:

- Not all documentation is publicly available.
- Possible compatibility issues between libraries and code.

