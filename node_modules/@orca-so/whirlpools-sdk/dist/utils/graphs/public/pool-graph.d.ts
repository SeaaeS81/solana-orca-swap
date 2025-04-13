import type { Address } from "@coral-xyz/anchor";
export interface PoolTokenPair {
    address: Address;
    tokenMintA: Address;
    tokenMintB: Address;
}
export type PathSearchEntries = (readonly [string, Path[]])[];
export type Path = {
    startTokenMint: string;
    endTokenMint: string;
    edges: Edge[];
};
export type Edge = {
    poolAddress: Address;
};
export type PathSearchOptions = {
    intermediateTokens: Address[];
};
export type PoolGraph = {
    getPath: (startMint: Address, endMint: Address, options?: PathSearchOptions) => Path[];
    getPathsForPairs(searchTokenPairs: [Address, Address][], options?: PathSearchOptions): PathSearchEntries;
    getAllPaths(options?: PathSearchOptions): PathSearchEntries;
};
