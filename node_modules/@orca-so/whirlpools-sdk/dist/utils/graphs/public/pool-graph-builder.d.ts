import type { Address } from "@coral-xyz/anchor";
import type { WhirlpoolAccountFetcherInterface } from "../../../network/public/fetcher";
import type { PoolGraph, PoolTokenPair } from "./pool-graph";
export declare class PoolGraphBuilder {
    static buildPoolGraphWithFetch(pools: Address[], fetcher: WhirlpoolAccountFetcherInterface): Promise<PoolGraph>;
    static buildPoolGraph(poolTokenPairs: PoolTokenPair[]): PoolGraph;
}
