import BN from "bn.js";
import type { WhirlpoolData } from "../../types/public";
import type { TickArraySequence } from "./tick-array-sequence";
export type SwapResult = {
    amountA: BN;
    amountB: BN;
    nextTickIndex: number;
    nextSqrtPrice: BN;
    totalFeeAmount: BN;
};
export declare function computeSwap(whirlpoolData: WhirlpoolData, tickSequence: TickArraySequence, tokenAmount: BN, sqrtPriceLimit: BN, amountSpecifiedIsInput: boolean, aToB: boolean): SwapResult;
