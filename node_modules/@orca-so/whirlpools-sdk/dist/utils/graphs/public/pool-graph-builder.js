"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolGraphBuilder = void 0;
const fetcher_1 = require("../../../network/public/fetcher");
const adjacency_list_pool_graph_1 = require("../adjacency-list-pool-graph");
class PoolGraphBuilder {
    static async buildPoolGraphWithFetch(pools, fetcher) {
        const poolAccounts = await fetcher.getPools(pools, fetcher_1.PREFER_CACHE);
        const poolTokenPairs = Array.from(poolAccounts.entries())
            .map(([addr, pool]) => {
            if (pool) {
                return {
                    address: addr,
                    tokenMintA: pool.tokenMintA,
                    tokenMintB: pool.tokenMintB,
                };
            }
            return null;
        })
            .flatMap((pool) => (pool ? pool : []));
        return new adjacency_list_pool_graph_1.AdjacencyListPoolGraph(poolTokenPairs);
    }
    static buildPoolGraph(poolTokenPairs) {
        return new adjacency_list_pool_graph_1.AdjacencyListPoolGraph(poolTokenPairs);
    }
}
exports.PoolGraphBuilder = PoolGraphBuilder;
//# sourceMappingURL=pool-graph-builder.js.map