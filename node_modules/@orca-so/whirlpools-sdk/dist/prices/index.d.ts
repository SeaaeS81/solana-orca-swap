import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import type Decimal from "decimal.js";
import type { TickArrayData, WhirlpoolData } from "../types/public";
export * from "./price-module";
export type GetPricesConfig = {
    quoteTokens: PublicKey[];
    tickSpacings: number[];
    programId: PublicKey;
    whirlpoolsConfig: PublicKey;
};
export type GetPricesThresholdConfig = {
    amountOut: BN;
    priceImpactThreshold: number;
};
export type PriceCalculationData = {
    poolMap: PoolMap;
    tickArrayMap: TickArrayMap;
    decimalsMap: DecimalsMap;
};
export type PoolMap = Record<string, WhirlpoolData>;
export type TickArrayMap = Record<string, TickArrayData>;
export type PriceMap = Record<string, Decimal | null>;
export type DecimalsMap = Record<string, number>;
export declare const defaultQuoteTokens: PublicKey[];
export declare const defaultGetPricesConfig: GetPricesConfig;
export declare const defaultGetPricesThresholdConfig: GetPricesThresholdConfig;
