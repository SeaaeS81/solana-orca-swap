"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterUtils = void 0;
const common_sdk_1 = require("@orca-so/common-sdk");
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const swap_with_route_1 = require("../../instructions/composites/swap-with-route");
const fetcher_1 = require("../../network/public/fetcher");
const constants_1 = require("../../utils/math/constants");
const public_1 = require("../../utils/public");
const wallet_utils_1 = require("../../utils/wallet-utils");
class RouterUtils {
    static async selectFirstExecutableRoute(ctx, orderedRoutes, opts) {
        const { wallet } = ctx;
        if (orderedRoutes.length === 0) {
            return null;
        }
        if (!(0, wallet_utils_1.isWalletConnected)(wallet)) {
            return [orderedRoutes[0], undefined];
        }
        if (opts.maxSupportedTransactionVersion !== "legacy" &&
            ctx.lookupTableFetcher) {
            await loadLookupTablesForRoutes(ctx.lookupTableFetcher, orderedRoutes);
        }
        for (let i = 0; i < orderedRoutes.length && i < MEASURE_ROUTE_MAX; i++) {
            const route = orderedRoutes[i];
            const tx = await (0, swap_with_route_1.getSwapFromRoute)(ctx, {
                route,
                slippage: common_sdk_1.Percentage.fromFraction(0, 100),
                resolvedAtaAccounts: opts.availableAtaAccounts ?? null,
                wallet: wallet.publicKey,
            }, fetcher_1.PREFER_CACHE);
            if (!!opts.onRouteEvaluation) {
                opts.onRouteEvaluation(route, tx);
            }
            try {
                const legacyTxSize = tx.txnSize({
                    latestBlockhash: common_sdk_1.MEASUREMENT_BLOCKHASH,
                    maxSupportedTransactionVersion: "legacy",
                });
                if (legacyTxSize !== undefined &&
                    legacyTxSize <= opts.maxTransactionSize) {
                    return [route, undefined];
                }
            }
            catch {
            }
            let v0TxSize;
            if (opts.maxSupportedTransactionVersion !== "legacy" &&
                ctx.lookupTableFetcher) {
                const addressesToLookup = RouterUtils.getTouchedTickArraysFromRoute(route);
                if (addressesToLookup.length > MAX_LOOKUP_TABLE_FETCH_SIZE) {
                    continue;
                }
                const lookupTableAccounts = await ctx.lookupTableFetcher.getLookupTableAccountsForAddresses(addressesToLookup);
                try {
                    v0TxSize = tx.txnSize({
                        latestBlockhash: common_sdk_1.MEASUREMENT_BLOCKHASH,
                        maxSupportedTransactionVersion: opts.maxSupportedTransactionVersion,
                        lookupTableAccounts,
                    });
                    if (v0TxSize !== undefined && v0TxSize <= opts.maxTransactionSize) {
                        return [route, lookupTableAccounts];
                    }
                }
                catch {
                }
            }
        }
        return null;
    }
    static getPriceImpactForRoute(trade, route) {
        const { amountSpecifiedIsInput } = trade;
        const totalBaseValue = route.subRoutes.reduce((acc, route) => {
            const directionalHops = amountSpecifiedIsInput
                ? route.hopQuotes
                : route.hopQuotes.slice().reverse();
            const baseOutputs = directionalHops.reduce((acc, quote, index) => {
                const { snapshot } = quote;
                const { aToB, sqrtPrice, feeRate } = snapshot;
                const directionalSqrtPrice = aToB
                    ? sqrtPrice
                    : public_1.PriceMath.invertSqrtPriceX64(sqrtPrice);
                let nextBaseValue;
                const price = directionalSqrtPrice.mul(directionalSqrtPrice).div(constants_1.U64);
                if (amountSpecifiedIsInput) {
                    const amountIn = index === 0 ? quote.amountIn : acc[index - 1];
                    const feeAdjustedAmount = amountIn
                        .mul(feeRate.denominator.sub(feeRate.numerator))
                        .div(feeRate.denominator);
                    nextBaseValue = price.mul(feeAdjustedAmount).div(constants_1.U64);
                }
                else {
                    const amountOut = index === 0 ? quote.amountOut : acc[index - 1];
                    const feeAdjustedAmount = amountOut.mul(constants_1.U64).div(price);
                    nextBaseValue = feeAdjustedAmount
                        .mul(feeRate.denominator)
                        .div(feeRate.denominator.sub(feeRate.numerator));
                }
                acc.push(nextBaseValue);
                return acc;
            }, new Array());
            return acc.add(baseOutputs[baseOutputs.length - 1]);
        }, new bn_js_1.default(0));
        const totalBaseValueDec = new decimal_js_1.default(totalBaseValue.toString());
        const totalAmountEstimatedDec = new decimal_js_1.default(amountSpecifiedIsInput
            ? route.totalAmountOut.toString()
            : route.totalAmountIn.toString());
        const priceImpact = amountSpecifiedIsInput
            ? totalBaseValueDec.sub(totalAmountEstimatedDec).div(totalBaseValueDec)
            : totalAmountEstimatedDec
                .sub(totalBaseValueDec)
                .div(totalAmountEstimatedDec);
        return priceImpact.mul(100);
    }
    static getTouchedTickArraysFromRoute(route) {
        const taAddresses = new Set();
        for (const quote of route.subRoutes) {
            for (const hop of quote.hopQuotes) {
                taAddresses.add(hop.quote.tickArray0.toBase58());
                taAddresses.add(hop.quote.tickArray1.toBase58());
                taAddresses.add(hop.quote.tickArray2.toBase58());
            }
        }
        return common_sdk_1.AddressUtil.toPubKeys(Array.from(taAddresses));
    }
    static getDefaultRouteOptions() {
        return {
            percentIncrement: 20,
            numTopRoutes: 50,
            numTopPartialQuotes: 10,
            maxSplits: 3,
        };
    }
    static getDefaultSelectOptions() {
        return {
            maxSupportedTransactionVersion: 0,
            maxTransactionSize: common_sdk_1.TX_SIZE_LIMIT,
        };
    }
}
exports.RouterUtils = RouterUtils;
async function loadLookupTablesForRoutes(lookupTableFetcher, routes) {
    const altTicks = new Set();
    for (let i = 0; i < routes.length && i < MEASURE_ROUTE_MAX; i++) {
        const route = routes[i];
        RouterUtils.getTouchedTickArraysFromRoute(route).map((ta) => altTicks.add(ta.toBase58()));
    }
    const altTickArray = Array.from(altTicks);
    const altPageSize = 45;
    const altRequests = [];
    for (let i = 0; i < altTickArray.length; i += altPageSize) {
        altRequests.push(altTickArray.slice(i, i + altPageSize));
    }
    await Promise.all(altRequests.map((altPage) => {
        const altPageKeys = common_sdk_1.AddressUtil.toPubKeys(altPage);
        lookupTableFetcher.loadLookupTables(altPageKeys);
    }));
}
const MEASURE_ROUTE_MAX = 100;
const MAX_LOOKUP_TABLE_FETCH_SIZE = 50;
//# sourceMappingURL=router-utils.js.map