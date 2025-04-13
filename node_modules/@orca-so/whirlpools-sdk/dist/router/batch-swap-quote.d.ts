import type { Address } from "@coral-xyz/anchor";
import type BN from "bn.js";
import type { WhirlpoolAccountFetcherInterface, WhirlpoolAccountFetchOptions } from "../network/public/fetcher";
import type { SwapQuoteParam } from "../quotes/public";
export interface SwapQuoteRequest {
    whirlpool: Address;
    tradeTokenMint: Address;
    tokenAmount: BN;
    amountSpecifiedIsInput: boolean;
}
export declare function batchBuildSwapQuoteParams(quoteRequests: SwapQuoteRequest[], programId: Address, fetcher: WhirlpoolAccountFetcherInterface, opts?: WhirlpoolAccountFetchOptions): Promise<SwapQuoteParam[]>;
