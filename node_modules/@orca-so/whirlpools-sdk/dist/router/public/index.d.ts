import type { Address } from "@coral-xyz/anchor";
import type { Percentage, TransactionBuilder } from "@orca-so/common-sdk";
import type { AddressLookupTableAccount } from "@solana/web3.js";
import type BN from "bn.js";
import type { WhirlpoolAccountFetchOptions } from "../../network/public/fetcher";
import type { SwapQuote } from "../../quotes/public";
import type { Path } from "../../utils/public";
import type { AtaAccountInfo, RouteSelectOptions } from "./router-utils";
export * from "./router-builder";
export * from "./router-utils";
export type Trade = {
    tokenIn: Address;
    tokenOut: Address;
    tradeAmount: BN;
    amountSpecifiedIsInput: boolean;
};
export type RoutingOptions = {
    percentIncrement: number;
    numTopRoutes: number;
    numTopPartialQuotes: number;
    maxSplits: number;
};
export type TradeRoute = {
    subRoutes: SubTradeRoute[];
    totalAmountIn: BN;
    totalAmountOut: BN;
};
export type SubTradeRoute = {
    path: Path;
    splitPercent: number;
    amountIn: BN;
    amountOut: BN;
    hopQuotes: TradeHop[];
};
export type TradeHop = {
    amountIn: BN;
    amountOut: BN;
    whirlpool: Address;
    inputMint: Address;
    outputMint: Address;
    mintA: Address;
    mintB: Address;
    vaultA: Address;
    vaultB: Address;
    quote: SwapQuote;
    snapshot: TradeHopSnapshot;
};
export type TradeHopSnapshot = {
    aToB: boolean;
    sqrtPrice: BN;
    feeRate: Percentage;
};
export type ExecutableRoute = readonly [
    TradeRoute,
    AddressLookupTableAccount[] | undefined
];
export interface WhirlpoolRouter {
    findAllRoutes(trade: Trade, opts?: Partial<RoutingOptions>, fetchOpts?: WhirlpoolAccountFetchOptions): Promise<TradeRoute[]>;
    findBestRoute(trade: Trade, opts?: Partial<RoutingOptions>, selectionOpts?: Partial<RouteSelectOptions>, fetchOpts?: WhirlpoolAccountFetchOptions): Promise<ExecutableRoute | null>;
    swap(trade: TradeRoute, slippage: Percentage, resolvedAtas: AtaAccountInfo[] | null): Promise<TransactionBuilder>;
}
