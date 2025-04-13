import { BN } from "bn.js";// Инструмент для работы с большими числами
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";// Связь с Solana и ключи
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";// Кошелёк и настройки
import { DecimalUtil, Percentage } from "@orca-so/common-sdk";// Помощь с числами и процентами
import { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID, swapQuoteByInputToken } from "@orca-so/whirlpools-sdk";// Инструменты Orca для обмена
import * as dotenv from "dotenv";// Чтение секретных данных

const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const JITO_SOL_MINT = new PublicKey("J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn");
const WFRAG_SOL_MINT = new PublicKey("WFRGSWjaz8tbAxsJitmbfRuFV2mSNwy7BMWcCwaA28U");
const SOL_JITOSOL_POOL = new PublicKey("Hp53XEtt4S8SvPCXarsLSdGfZBuUr5mMmZmX2DRNXQKp");
const JITOSOL_WFRAGSOL_POOL = new PublicKey("5xfKkFmhzNhHKTFUkh4PJmHSWB6LpRvhJcUMKzPP6md2");
const RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=0a9c830e-335d-416d-a3cb-cdb534352664";

// Загружаем секретные данные
async function main() {
  dotenv.config();
  const privateKeyRaw = process.env.PRIVATE_KEY;
  if (!privateKeyRaw) throw new Error("PRIVATE_KEY не задан");// Проверяем, есть ли ключ

  let privateKey: Uint8Array; // Преобразуем ключ в нужный вид
  try {
    privateKey = Uint8Array.from(JSON.parse(privateKeyRaw));
  } catch (e) {
    throw new Error(`Ошибка парсинга PRIVATE_KEY: ${e}`); // Если ключ сломан, говорим об этом
  }

// Соединяемся с Solana
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const dummyWallet = Keypair.fromSecretKey(privateKey); // Создаём кошелёк из ключа
  const provider = new AnchorProvider(connection, new Wallet(dummyWallet), { commitment: "confirmed" }); // Настраиваем доступ
  console.log("Wallet:", dummyWallet.publicKey.toBase58()); // Показываем адрес кошелька

  const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);// Связываемся с Orca
  const client = buildWhirlpoolClient(ctx); // Инструмент для работы с рынками

  const whirlpoolOne = await client.getPool(SOL_JITOSOL_POOL); // Рынок SOL/JitoSOL
  const whirlpoolTwo = await client.getPool(JITOSOL_WFRAGSOL_POOL); // Рынок JitoSOL/wfragSOL
  const whirlpoolOneData = await whirlpoolOne.getData(); // Информация о первом рынке
  const whirlpoolTwoData = await whirlpoolTwo.getData(); // Информация о втором рынке

  const inputAmount = new BN(Math.floor(0.01 * LAMPORTS_PER_SOL));
  const slippage = Percentage.fromFraction(1, 100); // Разрешить отклонение цены на 1%

  console.log("Первый своп (SOL -> JitoSOL)..."); // Первый обмен: SOL → JitoSOL
  const quoteOne = await swapQuoteByInputToken(
    whirlpoolOne,
    SOL_MINT,
    inputAmount,
    slippage,
    ctx.program.programId,
    ctx.fetcher
  ); // Считаем, сколько дадут JitoSOL
  console.log("Ожидаемый выход JitoSOL:", DecimalUtil.fromBN(quoteOne.estimatedAmountOut, 9).toString()); // Показываем результат
// Готовим и делаем второй обмен
  const swapTxOne = await whirlpoolOne.swap({
    amount: inputAmount, // Сколько JitoSOL даём
    otherAmountThreshold: quoteOne.otherAmountThreshold, // Минимальная сумма wfragSOL
    sqrtPriceLimit: quoteOne.sqrtPriceLimit, // Лимит цены
    amountSpecifiedIsInput: true, // Даём точную сумму
    aToB: whirlpoolOneData.tokenMintA.equals(SOL_MINT), // Направление: JitoSOL → wfragSOL
    tickArray0: quoteOne.tickArray0, // Данные для рынка
    tickArray1: quoteOne.tickArray1,
    tickArray2: quoteOne.tickArray2,
  });

  const txidOne = await swapTxOne.buildAndExecute(); // Отправляем сделку
  console.log("txid (SOL -> JitoSOL):", txidOne); // Показываем номер сделки

  console.log("Второй своп (JitoSOL -> wfragSOL)..."); // Второй обмен: JitoSOL → wfragSOL
  const quoteTwo = await swapQuoteByInputToken(
    whirlpoolTwo,
    JITO_SOL_MINT,
    quoteOne.estimatedAmountOut,
    slippage,
    ctx.program.programId,
    ctx.fetcher
  ); // Считаем, сколько дадут wfragSOL
  console.log("Ожидаемый выход wfragSOL:", DecimalUtil.fromBN(quoteTwo.estimatedAmountOut, 9).toString()); // Показываем результат
 // Готовим и делаем второй обмен
  const swapTxTwo = await whirlpoolTwo.swap({
    amount: quoteOne.estimatedAmountOut, // Сколько JitoSOL даём
    otherAmountThreshold: quoteTwo.otherAmountThreshold, // Минимальная сумма wfragSOL
    sqrtPriceLimit: quoteTwo.sqrtPriceLimit, // Лимит цены
    amountSpecifiedIsInput: true, // Даём точную сумму
    aToB: whirlpoolTwoData.tokenMintB.equals(WFRAG_SOL_MINT), // Направление: JitoSOL → wfragSOL
    tickArray0: quoteTwo.tickArray0, // Данные для рынка
    tickArray1: quoteTwo.tickArray1,
    tickArray2: quoteTwo.tickArray2,
  });

  const txidTwo = await swapTxTwo.buildAndExecute(); // Отправляем сделку
  console.log("txid (JitoSOL -> wfragSOL):", txidTwo); // Показываем номер сделки
  console.log(`https://solscan.io/tx/${txidTwo}`); // Даём ссылку для проверки
}
// Запускаем код и ловим ошибки
main().catch((err) => {
  console.error("Ошибка:", err); // Если что-то сломалось, показываем
});