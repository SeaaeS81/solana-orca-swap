import type { Address } from "@coral-xyz/anchor";
import type { Path, PathSearchEntries, PathSearchOptions, PoolGraph, PoolTokenPair } from "./public/pool-graph";
export declare class AdjacencyListPoolGraph implements PoolGraph {
    readonly graph: Readonly<AdjacencyPoolGraphMap>;
    readonly tokens: Readonly<Address[]>;
    constructor(pools: PoolTokenPair[]);
    getPath(startMint: Address, endMint: Address, options?: PathSearchOptions): Path[];
    getPathsForPairs(searchTokenPairs: [Address, Address][], options?: PathSearchOptions): PathSearchEntries;
    getAllPaths(options?: PathSearchOptions | undefined): PathSearchEntries;
}
type AdjacencyPoolGraphMap = Record<string, readonly PoolGraphEdge[]>;
type PoolGraphEdge = {
    address: string;
    otherToken: string;
};
export {};
