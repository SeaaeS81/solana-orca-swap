"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseFallbackTickArray = void 0;
exports.swapQuoteByInputToken = swapQuoteByInputToken;
exports.swapQuoteByOutputToken = swapQuoteByOutputToken;
exports.swapQuoteWithParams = swapQuoteWithParams;
const common_sdk_1 = require("@orca-so/common-sdk");
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const fetcher_1 = require("../../network/public/fetcher");
const public_1 = require("../../types/public");
const public_2 = require("../../utils/public");
const swap_utils_1 = require("../../utils/public/swap-utils");
const swap_quote_impl_1 = require("../swap/swap-quote-impl");
const token_extension_util_1 = require("../../utils/public/token-extension-util");
const web3_js_1 = require("@solana/web3.js");
var UseFallbackTickArray;
(function (UseFallbackTickArray) {
    UseFallbackTickArray["Always"] = "Always";
    UseFallbackTickArray["Never"] = "Never";
    UseFallbackTickArray["Situational"] = "Situational";
})(UseFallbackTickArray || (exports.UseFallbackTickArray = UseFallbackTickArray = {}));
async function swapQuoteByInputToken(whirlpool, inputTokenMint, tokenAmount, slippageTolerance, programId, fetcher, opts, useFallbackTickArray = UseFallbackTickArray.Never) {
    const params = await swapQuoteByToken(whirlpool, inputTokenMint, tokenAmount, true, useFallbackTickArray, programId, fetcher, opts);
    return swapQuoteWithParams(params, slippageTolerance);
}
async function swapQuoteByOutputToken(whirlpool, outputTokenMint, tokenAmount, slippageTolerance, programId, fetcher, opts, useFallbackTickArray = UseFallbackTickArray.Never) {
    const params = await swapQuoteByToken(whirlpool, outputTokenMint, tokenAmount, false, useFallbackTickArray, programId, fetcher, opts);
    return swapQuoteWithParams(params, slippageTolerance);
}
function swapQuoteWithParams(params, slippageTolerance) {
    const quote = (0, swap_quote_impl_1.simulateSwap)({
        ...params,
        tickArrays: swap_utils_1.SwapUtils.interpolateUninitializedTickArrays(web3_js_1.PublicKey.default, params.tickArrays),
    });
    if (params.fallbackTickArray) {
        if (quote.tickArray2.equals(quote.tickArray1)) {
            quote.tickArray2 = params.fallbackTickArray;
        }
        else {
            quote.supplementalTickArrays = [params.fallbackTickArray];
        }
    }
    const slippageAdjustedQuote = {
        ...quote,
        ...swap_utils_1.SwapUtils.calculateSwapAmountsFromQuote(quote.amount, quote.estimatedAmountIn, quote.estimatedAmountOut, slippageTolerance, quote.amountSpecifiedIsInput),
    };
    return slippageAdjustedQuote;
}
async function swapQuoteByToken(whirlpool, inputTokenMint, tokenAmount, amountSpecifiedIsInput, useFallbackTickArray, programId, fetcher, opts) {
    const whirlpoolData = await fetcher.getPool(whirlpool.getAddress(), opts);
    (0, tiny_invariant_1.default)(!!whirlpoolData, "Whirlpool data not found");
    const swapMintKey = common_sdk_1.AddressUtil.toPubKey(inputTokenMint);
    const swapTokenType = public_2.PoolUtil.getTokenType(whirlpoolData, swapMintKey);
    (0, tiny_invariant_1.default)(!!swapTokenType, "swapTokenMint does not match any tokens on this pool");
    const aToB = swap_utils_1.SwapUtils.getSwapDirection(whirlpoolData, swapMintKey, amountSpecifiedIsInput) === public_2.SwapDirection.AtoB;
    const tickArrays = await swap_utils_1.SwapUtils.getTickArrays(whirlpoolData.tickCurrentIndex, whirlpoolData.tickSpacing, aToB, common_sdk_1.AddressUtil.toPubKey(programId), whirlpool.getAddress(), fetcher, opts);
    const fallbackTickArray = getFallbackTickArray(useFallbackTickArray, tickArrays, aToB, whirlpool, programId);
    const tokenExtensionCtx = await token_extension_util_1.TokenExtensionUtil.buildTokenExtensionContext(fetcher, whirlpoolData, fetcher_1.IGNORE_CACHE);
    return {
        whirlpoolData,
        tokenAmount,
        aToB,
        amountSpecifiedIsInput,
        sqrtPriceLimit: swap_utils_1.SwapUtils.getDefaultSqrtPriceLimit(aToB),
        otherAmountThreshold: swap_utils_1.SwapUtils.getDefaultOtherAmountThreshold(amountSpecifiedIsInput),
        tickArrays,
        tokenExtensionCtx,
        fallbackTickArray,
    };
}
function getFallbackTickArray(useFallbackTickArray, tickArrays, aToB, whirlpool, programId) {
    if (useFallbackTickArray === UseFallbackTickArray.Never) {
        return undefined;
    }
    const fallbackTickArray = swap_utils_1.SwapUtils.getFallbackTickArrayPublicKey(tickArrays, whirlpool.getData().tickSpacing, aToB, common_sdk_1.AddressUtil.toPubKey(programId), whirlpool.getAddress());
    if (useFallbackTickArray === UseFallbackTickArray.Always ||
        !fallbackTickArray) {
        return fallbackTickArray;
    }
    (0, tiny_invariant_1.default)(useFallbackTickArray === UseFallbackTickArray.Situational, `Unexpected UseFallbackTickArray value: ${useFallbackTickArray}`);
    const ticksInArray = whirlpool.getData().tickSpacing * public_1.TICK_ARRAY_SIZE;
    const tickCurrentIndex = whirlpool.getData().tickCurrentIndex;
    if (aToB) {
        const threshold = tickArrays[0].startTickIndex + (ticksInArray / 4) * 3;
        return tickCurrentIndex >= threshold ? fallbackTickArray : undefined;
    }
    else {
        const threshold = tickArrays[0].startTickIndex + ticksInArray / 4;
        return tickCurrentIndex <= threshold ? fallbackTickArray : undefined;
    }
}
//# sourceMappingURL=swap-quote.js.map