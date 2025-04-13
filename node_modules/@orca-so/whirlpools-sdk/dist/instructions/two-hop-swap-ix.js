"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoHopSwapIx = twoHopSwapIx;
const spl_token_1 = require("@solana/spl-token");
function twoHopSwapIx(program, params) {
    const { amount, otherAmountThreshold, amountSpecifiedIsInput, aToBOne, aToBTwo, sqrtPriceLimitOne, sqrtPriceLimitTwo, whirlpoolOne, whirlpoolTwo, tokenAuthority, tokenOwnerAccountOneA, tokenVaultOneA, tokenOwnerAccountOneB, tokenVaultOneB, tokenOwnerAccountTwoA, tokenVaultTwoA, tokenOwnerAccountTwoB, tokenVaultTwoB, tickArrayOne0, tickArrayOne1, tickArrayOne2, tickArrayTwo0, tickArrayTwo1, tickArrayTwo2, oracleOne, oracleTwo, } = params;
    const ix = program.instruction.twoHopSwap(amount, otherAmountThreshold, amountSpecifiedIsInput, aToBOne, aToBTwo, sqrtPriceLimitOne, sqrtPriceLimitTwo, {
        accounts: {
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            tokenAuthority,
            whirlpoolOne,
            whirlpoolTwo,
            tokenOwnerAccountOneA,
            tokenVaultOneA,
            tokenOwnerAccountOneB,
            tokenVaultOneB,
            tokenOwnerAccountTwoA,
            tokenVaultTwoA,
            tokenOwnerAccountTwoB,
            tokenVaultTwoB,
            tickArrayOne0,
            tickArrayOne1,
            tickArrayOne2,
            tickArrayTwo0,
            tickArrayTwo1,
            tickArrayTwo2,
            oracleOne,
            oracleTwo,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=two-hop-swap-ix.js.map