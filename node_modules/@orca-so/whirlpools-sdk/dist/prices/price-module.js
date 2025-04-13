"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceModuleUtils = exports.PriceModule = void 0;
const common_sdk_1 = require("@orca-so/common-sdk");
const web3_js_1 = require("@solana/web3.js");
const _1 = require(".");
const fetcher_1 = require("../network/public/fetcher");
const public_1 = require("../utils/public");
const txn_utils_1 = require("../utils/txn-utils");
const calculate_pool_prices_1 = require("./calculate-pool-prices");
class PriceModule {
    static async fetchTokenPricesByMints(fetcher, mints, config = _1.defaultGetPricesConfig, thresholdConfig = _1.defaultGetPricesThresholdConfig, opts = fetcher_1.IGNORE_CACHE, availableData = {}) {
        const poolMap = availableData?.poolMap
            ? availableData?.poolMap
            : await PriceModuleUtils.fetchPoolDataFromMints(fetcher, mints, config, opts);
        const tickArrayMap = availableData?.tickArrayMap
            ? availableData.tickArrayMap
            : await PriceModuleUtils.fetchTickArraysForPools(fetcher, poolMap, config, opts);
        const decimalsMap = availableData?.decimalsMap
            ? availableData.decimalsMap
            : await PriceModuleUtils.fetchDecimalsForMints(fetcher, mints, fetcher_1.PREFER_CACHE);
        return PriceModule.calculateTokenPrices(mints, {
            poolMap,
            tickArrayMap,
            decimalsMap,
        }, config, thresholdConfig);
    }
    static async fetchTokenPricesByPools(fetcher, pools, config = _1.defaultGetPricesConfig, thresholdConfig = _1.defaultGetPricesThresholdConfig, opts = fetcher_1.IGNORE_CACHE) {
        const poolDatas = Array.from((await fetcher.getPools(pools, opts)).values());
        const [filteredPoolDatas, filteredPoolAddresses] = (0, txn_utils_1.filterNullObjects)(poolDatas, pools);
        const poolMap = (0, txn_utils_1.convertListToMap)(filteredPoolDatas, common_sdk_1.AddressUtil.toStrings(filteredPoolAddresses));
        const tickArrayMap = await PriceModuleUtils.fetchTickArraysForPools(fetcher, poolMap, config, opts);
        const mints = Array.from(Object.values(poolMap).reduce((acc, pool) => {
            acc.add(pool.tokenMintA.toBase58());
            acc.add(pool.tokenMintB.toBase58());
            return acc;
        }, new Set()));
        const decimalsMap = await PriceModuleUtils.fetchDecimalsForMints(fetcher, mints, fetcher_1.PREFER_CACHE);
        return PriceModule.calculateTokenPrices(mints, {
            poolMap,
            tickArrayMap,
            decimalsMap,
        }, config, thresholdConfig);
    }
    static calculateTokenPrices(mints, priceCalcData, config = _1.defaultGetPricesConfig, thresholdConfig = _1.defaultGetPricesThresholdConfig) {
        const { poolMap, decimalsMap, tickArrayMap } = priceCalcData;
        const mintStrings = common_sdk_1.AddressUtil.toStrings(mints);
        if (!(0, calculate_pool_prices_1.isSubset)(config.quoteTokens.map((mint) => common_sdk_1.AddressUtil.toString(mint)), mintStrings.map((mint) => mint))) {
            throw new Error("Quote tokens must be in mints array");
        }
        const results = Object.fromEntries(mintStrings.map((mint) => [mint, null]));
        const remainingQuoteTokens = config.quoteTokens.slice();
        let remainingMints = mints.slice();
        while (remainingQuoteTokens.length > 0 && remainingMints.length > 0) {
            const quoteToken = remainingQuoteTokens.shift();
            if (!quoteToken) {
                throw new Error("Unreachable: remainingQuoteTokens is an empty array");
            }
            let amountOutThresholdAgainstFirstQuoteToken;
            if (quoteToken.equals(config.quoteTokens[0])) {
                amountOutThresholdAgainstFirstQuoteToken = thresholdConfig.amountOut;
            }
            else {
                const quoteTokenStr = quoteToken.toBase58();
                const quoteTokenPrice = results[quoteTokenStr];
                if (!quoteTokenPrice) {
                    throw new Error(`Quote token - ${quoteTokenStr} must have a price against the first quote token`);
                }
                amountOutThresholdAgainstFirstQuoteToken = (0, calculate_pool_prices_1.convertAmount)(thresholdConfig.amountOut, quoteTokenPrice, decimalsMap[config.quoteTokens[0].toBase58()], decimalsMap[quoteTokenStr]);
            }
            const prices = (0, calculate_pool_prices_1.calculatePricesForQuoteToken)(remainingMints, quoteToken, poolMap, tickArrayMap, decimalsMap, config, {
                amountOut: amountOutThresholdAgainstFirstQuoteToken,
                priceImpactThreshold: thresholdConfig.priceImpactThreshold,
            });
            const quoteTokenPrice = results[quoteToken.toBase58()] || prices[quoteToken.toBase58()];
            remainingMints.forEach((mintAddr) => {
                const mint = common_sdk_1.AddressUtil.toString(mintAddr);
                const mintPrice = prices[mint];
                if (mintPrice != null && quoteTokenPrice != null) {
                    results[mint] = mintPrice.mul(quoteTokenPrice);
                }
            });
            remainingMints = remainingMints.filter((mint) => results[common_sdk_1.AddressUtil.toString(mint)] == null);
        }
        return results;
    }
}
exports.PriceModule = PriceModule;
class PriceModuleUtils {
    static async fetchPoolDataFromMints(fetcher, mints, config = _1.defaultGetPricesConfig, opts = fetcher_1.IGNORE_CACHE) {
        const { quoteTokens, tickSpacings, programId, whirlpoolsConfig } = config;
        const poolAddresses = mints
            .map((mint) => tickSpacings
            .map((tickSpacing) => {
            return quoteTokens.map((quoteToken) => {
                const [mintA, mintB] = public_1.PoolUtil.orderMints(mint, quoteToken);
                return public_1.PDAUtil.getWhirlpool(programId, whirlpoolsConfig, common_sdk_1.AddressUtil.toPubKey(mintA), common_sdk_1.AddressUtil.toPubKey(mintB), tickSpacing).publicKey.toBase58();
            });
        })
            .flat())
            .flat();
        const poolDatas = Array.from((await fetcher.getPools(poolAddresses, opts)).values());
        const [filteredPoolDatas, filteredPoolAddresses] = (0, txn_utils_1.filterNullObjects)(poolDatas, poolAddresses);
        return (0, txn_utils_1.convertListToMap)(filteredPoolDatas, filteredPoolAddresses);
    }
    static async fetchTickArraysForPools(fetcher, pools, config = _1.defaultGetPricesConfig, opts = fetcher_1.IGNORE_CACHE) {
        const { programId } = config;
        const getQuoteTokenOrder = (mint) => {
            const index = config.quoteTokens.findIndex((quoteToken) => quoteToken.equals(mint));
            return index === -1 ? config.quoteTokens.length : index;
        };
        const tickArrayAddressSet = new Set();
        Object.entries(pools).forEach(([address, pool]) => {
            const orderA = getQuoteTokenOrder(pool.tokenMintA);
            const orderB = getQuoteTokenOrder(pool.tokenMintB);
            if (orderA === orderB) {
                return;
            }
            const aToB = orderA > orderB;
            const tickArrayPubkeys = public_1.SwapUtils.getTickArrayPublicKeys(pool.tickCurrentIndex, pool.tickSpacing, aToB, programId, new web3_js_1.PublicKey(address));
            tickArrayPubkeys.forEach((p) => tickArrayAddressSet.add(p.toBase58()));
        });
        const tickArrayAddresses = Array.from(tickArrayAddressSet);
        const tickArrays = await fetcher.getTickArrays(tickArrayAddresses, opts);
        const [filteredTickArrays, filteredTickArrayAddresses] = (0, txn_utils_1.filterNullObjects)(tickArrays, tickArrayAddresses);
        return (0, txn_utils_1.convertListToMap)(filteredTickArrays, filteredTickArrayAddresses);
    }
    static async fetchDecimalsForMints(fetcher, mints, opts = fetcher_1.IGNORE_CACHE) {
        const mintInfos = Array.from((await fetcher.getMintInfos(mints, opts)).values());
        return mintInfos.reduce((acc, mintInfo, index) => {
            const mint = common_sdk_1.AddressUtil.toString(mints[index]);
            if (!mintInfo) {
                throw new Error(`Mint account does not exist: ${mint}`);
            }
            acc[mint] = mintInfo.decimals;
            return acc;
        }, {});
    }
}
exports.PriceModuleUtils = PriceModuleUtils;
//# sourceMappingURL=price-module.js.map