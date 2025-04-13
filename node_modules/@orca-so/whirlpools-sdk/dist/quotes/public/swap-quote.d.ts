import type { Address } from "@coral-xyz/anchor";
import type { Percentage } from "@orca-so/common-sdk";
import type BN from "bn.js";
import type { SwapInput } from "../../instructions";
import type { WhirlpoolAccountFetchOptions, WhirlpoolAccountFetcherInterface } from "../../network/public/fetcher";
import type { TickArray, WhirlpoolData } from "../../types/public";
import type { Whirlpool } from "../../whirlpool-client";
import type { DevFeeSwapQuote } from "./dev-fee-swap-quote";
import type { TokenExtensionContextForPool } from "../../utils/public/token-extension-util";
import { PublicKey } from "@solana/web3.js";
export declare enum UseFallbackTickArray {
    Always = "Always",
    Never = "Never",
    Situational = "Situational"
}
export type SwapQuoteParam = {
    whirlpoolData: WhirlpoolData;
    tokenAmount: BN;
    otherAmountThreshold: BN;
    sqrtPriceLimit: BN;
    aToB: boolean;
    amountSpecifiedIsInput: boolean;
    tickArrays: TickArray[];
    tokenExtensionCtx: TokenExtensionContextForPool;
    fallbackTickArray?: PublicKey;
};
export type SwapQuote = NormalSwapQuote | DevFeeSwapQuote;
export type SwapEstimates = {
    estimatedAmountIn: BN;
    estimatedAmountOut: BN;
    estimatedEndTickIndex: number;
    estimatedEndSqrtPrice: BN;
    estimatedFeeAmount: BN;
    transferFee: {
        deductingFromEstimatedAmountIn: BN;
        deductedFromEstimatedAmountOut: BN;
    };
};
export type NormalSwapQuote = SwapInput & SwapEstimates;
export declare function swapQuoteByInputToken(whirlpool: Whirlpool, inputTokenMint: Address, tokenAmount: BN, slippageTolerance: Percentage, programId: Address, fetcher: WhirlpoolAccountFetcherInterface, opts?: WhirlpoolAccountFetchOptions, useFallbackTickArray?: UseFallbackTickArray): Promise<SwapQuote>;
export declare function swapQuoteByOutputToken(whirlpool: Whirlpool, outputTokenMint: Address, tokenAmount: BN, slippageTolerance: Percentage, programId: Address, fetcher: WhirlpoolAccountFetcherInterface, opts?: WhirlpoolAccountFetchOptions, useFallbackTickArray?: UseFallbackTickArray): Promise<SwapQuote>;
export declare function swapQuoteWithParams(params: SwapQuoteParam, slippageTolerance: Percentage): SwapQuote;
