import type { TransactionBuilder } from "@orca-so/common-sdk";
import type { Account } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import type { ExecutableRoute, RoutingOptions, Trade, TradeRoute } from ".";
import type { WhirlpoolContext } from "../../context";
export type AtaAccountInfo = Pick<Account, "address" | "owner" | "mint">;
export type RouteSelectOptions = {
    maxSupportedTransactionVersion: "legacy" | number;
    maxTransactionSize: number;
    availableAtaAccounts?: AtaAccountInfo[];
    onRouteEvaluation?: (route: Readonly<TradeRoute>, tx: TransactionBuilder) => void;
};
export declare class RouterUtils {
    static selectFirstExecutableRoute(ctx: WhirlpoolContext, orderedRoutes: TradeRoute[], opts: RouteSelectOptions): Promise<ExecutableRoute | null>;
    static getPriceImpactForRoute(trade: Trade, route: TradeRoute): Decimal;
    static getTouchedTickArraysFromRoute(route: TradeRoute): PublicKey[];
    static getDefaultRouteOptions(): RoutingOptions;
    static getDefaultSelectOptions(): RouteSelectOptions;
}
