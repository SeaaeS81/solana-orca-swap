import type { Address } from "@coral-xyz/anchor";
export declare class PoolGraphUtils {
    static readonly PATH_ID_DELIMITER = "-";
    static getSearchPathId(tokenA: Address, tokenB: Address): string;
    static deconstructPathId(pathId: string): readonly [string, string];
}
