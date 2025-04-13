import type { Percentage } from "@orca-so/common-sdk";
import { TransactionBuilder } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import type { AtaAccountInfo, TradeRoute, WhirlpoolContext } from "../..";
import type { WhirlpoolAccountFetchOptions } from "../../network/public/fetcher";
export type SwapFromRouteParams = {
    route: TradeRoute;
    slippage: Percentage;
    wallet: PublicKey;
    resolvedAtaAccounts: AtaAccountInfo[] | null;
};
export declare function getSwapFromRoute(ctx: WhirlpoolContext, params: SwapFromRouteParams, opts?: WhirlpoolAccountFetchOptions, txBuilder?: TransactionBuilder): Promise<TransactionBuilder>;
