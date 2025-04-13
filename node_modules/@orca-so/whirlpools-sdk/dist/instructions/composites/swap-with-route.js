"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSwapFromRoute = getSwapFromRoute;
const common_sdk_1 = require("@orca-so/common-sdk");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const __1 = require("../..");
const fetcher_1 = require("../../network/public/fetcher");
const position_util_1 = require("../../utils/position-util");
const txn_utils_1 = require("../../utils/txn-utils");
const swap_ix_1 = require("../swap-ix");
const two_hop_swap_ix_1 = require("../two-hop-swap-ix");
async function getSwapFromRoute(ctx, params, opts = fetcher_1.PREFER_CACHE, txBuilder = new common_sdk_1.TransactionBuilder(ctx.connection, ctx.wallet, (0, txn_utils_1.contextOptionsToBuilderOptions)(ctx.opts))) {
    const { route, wallet, resolvedAtaAccounts, slippage } = params;
    const requiredAtas = new Set();
    const requiredIntermediateAtas = new Set();
    const requiredTickArrays = [];
    let hasNativeMint = false;
    let nativeMintAmount = new bn_js_1.default(0);
    function addOrNative(mint, amount) {
        if (mint === spl_token_1.NATIVE_MINT.toBase58()) {
            hasNativeMint = true;
            nativeMintAmount = nativeMintAmount.add(amount);
        }
        else {
            requiredAtas.add(mint);
        }
    }
    for (let i = 0; i < route.subRoutes.length; i++) {
        const routeFragment = route.subRoutes[i];
        const slippageAdjustedRoute = adjustQuoteForSlippage(routeFragment, slippage);
        if (slippageAdjustedRoute.hopQuotes.length == 1) {
            const { quote, mintA, mintB } = slippageAdjustedRoute.hopQuotes[0];
            requiredTickArrays.push(...[quote.tickArray0, quote.tickArray1, quote.tickArray2]);
            const inputAmount = quote.amountSpecifiedIsInput
                ? quote.amount
                : quote.otherAmountThreshold;
            addOrNative(mintA.toString(), quote.aToB ? inputAmount : common_sdk_1.ZERO);
            addOrNative(mintB.toString(), !quote.aToB ? inputAmount : common_sdk_1.ZERO);
        }
        else if (slippageAdjustedRoute.hopQuotes.length == 2) {
            const { quote: quoteOne, mintA: mintOneA, mintB: mintOneB, } = slippageAdjustedRoute.hopQuotes[0];
            const { quote: quoteTwo, mintA: mintTwoA, mintB: mintTwoB, } = slippageAdjustedRoute.hopQuotes[1];
            const twoHopQuote = (0, __1.twoHopSwapQuoteFromSwapQuotes)(quoteOne, quoteTwo);
            requiredTickArrays.push(...[
                twoHopQuote.tickArrayOne0,
                twoHopQuote.tickArrayOne1,
                twoHopQuote.tickArrayOne2,
                twoHopQuote.tickArrayTwo0,
                twoHopQuote.tickArrayTwo1,
                twoHopQuote.tickArrayTwo2,
            ]);
            const inputAmount = quoteOne.amountSpecifiedIsInput
                ? quoteOne.estimatedAmountIn
                : quoteOne.otherAmountThreshold;
            addOrNative(mintOneA.toString(), quoteOne.aToB ? inputAmount : common_sdk_1.ZERO);
            addOrNative(mintOneB.toString(), !quoteOne.aToB ? inputAmount : common_sdk_1.ZERO);
            addOrNative(mintTwoA.toString(), common_sdk_1.ZERO);
            addOrNative(mintTwoB.toString(), common_sdk_1.ZERO);
            requiredIntermediateAtas.add(quoteOne.aToB ? mintOneB.toString() : mintOneA.toString());
        }
    }
    requiredAtas.delete(spl_token_1.NATIVE_MINT.toBase58());
    const ataInstructionMap = await cachedResolveOrCreateNonNativeATAs(wallet, requiredAtas, requiredIntermediateAtas, (keys) => {
        if (resolvedAtaAccounts != null) {
            return Promise.resolve(keys.map((key) => resolvedAtaAccounts.find((ata) => ata.address?.toBase58() === key.toBase58())));
        }
        else {
            return ctx.fetcher
                .getTokenInfos(keys, opts)
                .then((result) => Array.from(result.values()));
        }
    }, undefined, ctx.accountResolverOpts.allowPDAOwnerAddress);
    const ataIxes = Object.values(ataInstructionMap);
    if (hasNativeMint) {
        const solIx = common_sdk_1.TokenUtil.createWrappedNativeAccountInstruction(wallet, nativeMintAmount, await ctx.fetcher.getAccountRentExempt(), undefined, undefined, ctx.accountResolverOpts.createWrappedSolAccountMethod);
        txBuilder.addInstruction(solIx);
        ataInstructionMap[spl_token_1.NATIVE_MINT.toBase58()] = solIx;
    }
    txBuilder.addInstructions(ataIxes);
    const slippageAdjustedQuotes = route.subRoutes.map((quote) => adjustQuoteForSlippage(quote, slippage));
    for (let i = 0; i < slippageAdjustedQuotes.length; i++) {
        const routeFragment = slippageAdjustedQuotes[i];
        if (routeFragment.hopQuotes.length == 1) {
            const { quote, whirlpool, mintA, mintB, vaultA, vaultB } = routeFragment.hopQuotes[0];
            const [wp, tokenVaultA, tokenVaultB] = common_sdk_1.AddressUtil.toPubKeys([
                whirlpool,
                vaultA,
                vaultB,
            ]);
            const accA = ataInstructionMap[mintA.toString()].address;
            const accB = ataInstructionMap[mintB.toString()].address;
            const oraclePda = __1.PDAUtil.getOracle(ctx.program.programId, wp);
            txBuilder.addInstruction((0, swap_ix_1.swapIx)(ctx.program, {
                whirlpool: wp,
                tokenOwnerAccountA: accA,
                tokenOwnerAccountB: accB,
                tokenVaultA,
                tokenVaultB,
                oracle: oraclePda.publicKey,
                tokenAuthority: wallet,
                ...quote,
            }));
        }
        else if (routeFragment.hopQuotes.length == 2) {
            const { quote: quoteOne, whirlpool: whirlpoolOne, mintA: mintOneA, mintB: mintOneB, vaultA: vaultOneA, vaultB: vaultOneB, } = routeFragment.hopQuotes[0];
            const { quote: quoteTwo, whirlpool: whirlpoolTwo, mintA: mintTwoA, mintB: mintTwoB, vaultA: vaultTwoA, vaultB: vaultTwoB, } = routeFragment.hopQuotes[1];
            const [wpOne, wpTwo, tokenVaultOneA, tokenVaultOneB, tokenVaultTwoA, tokenVaultTwoB,] = common_sdk_1.AddressUtil.toPubKeys([
                whirlpoolOne,
                whirlpoolTwo,
                vaultOneA,
                vaultOneB,
                vaultTwoA,
                vaultTwoB,
            ]);
            const twoHopQuote = (0, __1.twoHopSwapQuoteFromSwapQuotes)(quoteOne, quoteTwo);
            const oracleOne = __1.PDAUtil.getOracle(ctx.program.programId, wpOne).publicKey;
            const oracleTwo = __1.PDAUtil.getOracle(ctx.program.programId, wpTwo).publicKey;
            const tokenOwnerAccountOneA = ataInstructionMap[mintOneA.toString()].address;
            const tokenOwnerAccountOneB = ataInstructionMap[mintOneB.toString()].address;
            const tokenOwnerAccountTwoA = ataInstructionMap[mintTwoA.toString()].address;
            const tokenOwnerAccountTwoB = ataInstructionMap[mintTwoB.toString()].address;
            txBuilder.addInstruction((0, two_hop_swap_ix_1.twoHopSwapIx)(ctx.program, {
                ...twoHopQuote,
                whirlpoolOne: wpOne,
                whirlpoolTwo: wpTwo,
                tokenOwnerAccountOneA,
                tokenOwnerAccountOneB,
                tokenOwnerAccountTwoA,
                tokenOwnerAccountTwoB,
                tokenVaultOneA,
                tokenVaultOneB,
                tokenVaultTwoA,
                tokenVaultTwoB,
                oracleOne,
                oracleTwo,
                tokenAuthority: wallet,
            }));
        }
    }
    return txBuilder;
}
function adjustQuoteForSlippage(quote, slippage) {
    const { hopQuotes } = quote;
    if (hopQuotes.length === 1) {
        return {
            ...quote,
            hopQuotes: [
                {
                    ...hopQuotes[0],
                    quote: {
                        ...hopQuotes[0].quote,
                        ...__1.SwapUtils.calculateSwapAmountsFromQuote(hopQuotes[0].quote.amount, hopQuotes[0].quote.estimatedAmountIn, hopQuotes[0].quote.estimatedAmountOut, slippage, hopQuotes[0].quote.amountSpecifiedIsInput),
                    },
                },
            ],
        };
    }
    else if (quote.hopQuotes.length === 2) {
        const swapQuoteOne = quote.hopQuotes[0];
        const swapQuoteTwo = quote.hopQuotes[1];
        const amountSpecifiedIsInput = swapQuoteOne.quote.amountSpecifiedIsInput;
        let updatedQuote = {
            ...quote,
        };
        if (amountSpecifiedIsInput) {
            updatedQuote.hopQuotes = [
                updatedQuote.hopQuotes[0],
                {
                    ...swapQuoteTwo,
                    quote: {
                        ...swapQuoteTwo.quote,
                        otherAmountThreshold: (0, position_util_1.adjustForSlippage)(swapQuoteTwo.quote.estimatedAmountOut, slippage, false),
                    },
                },
            ];
        }
        else {
            updatedQuote.hopQuotes = [
                {
                    ...swapQuoteOne,
                    quote: {
                        ...swapQuoteOne.quote,
                        otherAmountThreshold: (0, position_util_1.adjustForSlippage)(swapQuoteOne.quote.estimatedAmountIn, slippage, true),
                    },
                },
                updatedQuote.hopQuotes[1],
            ];
        }
        return updatedQuote;
    }
    return quote;
}
async function cachedResolveOrCreateNonNativeATAs(ownerAddress, tokenMints, intermediateTokenMints, getTokenAccounts, payer = ownerAddress, allowPDAOwnerAddress = false) {
    const instructionMap = {};
    const tokenMintArray = Array.from(tokenMints).map((tm) => new web3_js_1.PublicKey(tm));
    const tokenAtas = tokenMintArray.map((tm) => (0, spl_token_1.getAssociatedTokenAddressSync)(tm, ownerAddress, allowPDAOwnerAddress));
    const tokenAccounts = await getTokenAccounts(tokenAtas);
    tokenAccounts.forEach((tokenAccount, index) => {
        const ataAddress = tokenAtas[index];
        let resolvedInstruction;
        if (tokenAccount) {
            if (!tokenAccount.owner.equals(ownerAddress)) {
                throw new Error(`ATA with change of ownership detected: ${ataAddress.toBase58()}`);
            }
            resolvedInstruction = { address: ataAddress, ...common_sdk_1.EMPTY_INSTRUCTION };
        }
        else {
            const tokenMint = tokenMintArray[index];
            const createAtaInstructions = [
                (0, spl_token_1.createAssociatedTokenAccountInstruction)(payer, ataAddress, ownerAddress, tokenMint),
            ];
            let cleanupInstructions = [];
            if (intermediateTokenMints.has(tokenMint.toBase58())) {
                cleanupInstructions = [
                    (0, spl_token_1.createCloseAccountInstruction)(ataAddress, ownerAddress, ownerAddress),
                ];
            }
            resolvedInstruction = {
                address: ataAddress,
                instructions: createAtaInstructions,
                cleanupInstructions: cleanupInstructions,
                signers: [],
            };
        }
        instructionMap[tokenMintArray[index].toBase58()] = {
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            ...resolvedInstruction,
        };
    });
    return instructionMap;
}
//# sourceMappingURL=swap-with-route.js.map