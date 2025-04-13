"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapIx = swapIx;
const spl_token_1 = require("@solana/spl-token");
function swapIx(program, params) {
    const { amount, otherAmountThreshold, sqrtPriceLimit, amountSpecifiedIsInput, aToB, whirlpool, tokenAuthority, tokenOwnerAccountA, tokenVaultA, tokenOwnerAccountB, tokenVaultB, tickArray0, tickArray1, tickArray2, oracle, } = params;
    const ix = program.instruction.swap(amount, otherAmountThreshold, sqrtPriceLimit, amountSpecifiedIsInput, aToB, {
        accounts: {
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            tokenAuthority: tokenAuthority,
            whirlpool,
            tokenOwnerAccountA,
            tokenVaultA,
            tokenOwnerAccountB,
            tokenVaultB,
            tickArray0,
            tickArray1,
            tickArray2,
            oracle,
        },
    });
    return {
        instructions: [ix],
        cleanupInstructions: [],
        signers: [],
    };
}
//# sourceMappingURL=swap-ix.js.map