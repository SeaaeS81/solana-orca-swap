"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjacencyListPoolGraph = void 0;
const common_sdk_1 = require("@orca-so/common-sdk");
const pool_graph_utils_1 = require("./public/pool-graph-utils");
class AdjacencyListPoolGraph {
    graph;
    tokens;
    constructor(pools) {
        const [adjacencyListGraphMap, insertedTokens] = buildPoolGraph(pools);
        this.graph = adjacencyListGraphMap;
        this.tokens = Array.from(insertedTokens);
    }
    getPath(startMint, endMint, options) {
        const results = this.getPathsForPairs([[startMint, endMint]], options);
        return results[0][1];
    }
    getPathsForPairs(searchTokenPairs, options) {
        const searchTokenPairsInString = searchTokenPairs.map(([startMint, endMint]) => {
            return [
                common_sdk_1.AddressUtil.toString(startMint),
                common_sdk_1.AddressUtil.toString(endMint),
            ];
        });
        const searchTokenPairsToFind = searchTokenPairsInString.filter(([startMint, endMint]) => {
            return startMint !== endMint;
        });
        const walkMap = findWalks(searchTokenPairsToFind, this.graph, options?.intermediateTokens.map((token) => common_sdk_1.AddressUtil.toString(token)));
        const results = searchTokenPairsInString.map(([startMint, endMint]) => {
            const searchRouteId = pool_graph_utils_1.PoolGraphUtils.getSearchPathId(startMint, endMint);
            const [internalStartMint, internalEndMint] = [startMint, endMint].sort();
            const internalRouteId = getInternalRouteId(internalStartMint, internalEndMint, false);
            const reversed = internalStartMint !== startMint;
            const pathsForSearchPair = walkMap[internalRouteId];
            const paths = pathsForSearchPair
                ? pathsForSearchPair.map((path) => {
                    return {
                        startTokenMint: startMint,
                        endTokenMint: endMint,
                        edges: getHopsFromRoute(path, reversed),
                    };
                })
                : [];
            return [searchRouteId, paths];
        });
        return results;
    }
    getAllPaths(options) {
        const tokenPairCombinations = combinations2(this.tokens);
        const searchTokenPairsInString = tokenPairCombinations.map(([startMint, endMint]) => {
            return [startMint, endMint];
        });
        const searchTokenPairsToFind = searchTokenPairsInString.filter(([startMint, endMint]) => {
            return startMint !== endMint;
        });
        const walkMap = findWalks(searchTokenPairsToFind, this.graph, options?.intermediateTokens.map((token) => common_sdk_1.AddressUtil.toString(token)));
        const results = searchTokenPairsInString.reduce((acc, [startMint, endMint]) => {
            const searchRouteId = pool_graph_utils_1.PoolGraphUtils.getSearchPathId(startMint, endMint);
            if (startMint === endMint) {
                acc.push([searchRouteId, []]);
                return acc;
            }
            const [internalStartMint, internalEndMint] = [
                startMint,
                endMint,
            ].sort();
            const internalRouteId = getInternalRouteId(internalStartMint, internalEndMint, false);
            const reversed = internalStartMint !== startMint;
            const pathsForSearchPair = walkMap[internalRouteId];
            const paths = pathsForSearchPair
                ? pathsForSearchPair.map((path) => {
                    return {
                        startTokenMint: startMint,
                        endTokenMint: endMint,
                        edges: getHopsFromRoute(path, reversed),
                    };
                })
                : [];
            acc.push([searchRouteId, paths]);
            const reversedSearchRouteId = pool_graph_utils_1.PoolGraphUtils.getSearchPathId(endMint, startMint);
            const reversedPaths = pathsForSearchPair
                ? pathsForSearchPair.map((path) => {
                    return {
                        startTokenMint: endMint,
                        endTokenMint: startMint,
                        edges: getHopsFromRoute(path, !reversed),
                    };
                })
                : [];
            acc.push([reversedSearchRouteId, reversedPaths]);
            return acc;
        }, []);
        return results;
    }
}
exports.AdjacencyListPoolGraph = AdjacencyListPoolGraph;
function getHopsFromRoute(path, reversed) {
    const finalRoutes = reversed ? path.slice().reverse() : path;
    return finalRoutes.map((hopStr) => {
        return { poolAddress: hopStr };
    });
}
function buildPoolGraph(pools) {
    const insertedPoolCache = {};
    const insertedTokens = new Set();
    const poolGraphSet = pools.reduce((poolGraph, pool) => {
        const { address, tokenMintA, tokenMintB } = pool;
        const [addr, mintA, mintB] = common_sdk_1.AddressUtil.toStrings([
            address,
            tokenMintA,
            tokenMintB,
        ]);
        insertedTokens.add(mintA);
        insertedTokens.add(mintB);
        if (poolGraph[mintA] === undefined) {
            poolGraph[mintA] = [];
            insertedPoolCache[mintA] = new Set();
        }
        if (poolGraph[mintB] === undefined) {
            poolGraph[mintB] = [];
            insertedPoolCache[mintB] = new Set();
        }
        const [insertedPoolsForA, insertedPoolsForB] = [
            insertedPoolCache[mintA],
            insertedPoolCache[mintB],
        ];
        if (!insertedPoolsForA.has(addr)) {
            poolGraph[mintA].push({ address: addr, otherToken: mintB });
            insertedPoolsForA.add(addr);
        }
        if (!insertedPoolsForB.has(addr)) {
            poolGraph[mintB].push({ address: addr, otherToken: mintA });
            insertedPoolsForB.add(addr);
        }
        return poolGraph;
    }, {});
    return [poolGraphSet, insertedTokens];
}
function findWalks(tokenPairs, poolGraph, intermediateTokens) {
    const walks = {};
    tokenPairs.forEach(([tokenMintFrom, tokenMintTo]) => {
        let paths = [];
        const [internalTokenMintFrom, internalTokenMintTo] = [
            tokenMintFrom,
            tokenMintTo,
        ].sort();
        const internalPathId = getInternalRouteId(internalTokenMintFrom, internalTokenMintTo, false);
        const poolsForTokenFrom = poolGraph[internalTokenMintFrom] || [];
        const poolsForTokenTo = poolGraph[internalTokenMintTo] || [];
        if (!!walks[internalPathId]) {
            return;
        }
        const singleHop = poolsForTokenFrom
            .filter(({ address }) => poolsForTokenTo.some((p) => p.address === address))
            .map((op) => [op.address]);
        paths.push(...singleHop);
        const firstHop = poolsForTokenFrom.filter(({ address }) => !poolsForTokenTo.some((p) => p.address === address));
        firstHop.forEach((firstPool) => {
            const intermediateToken = firstPool.otherToken;
            if (!intermediateTokens ||
                intermediateTokens.indexOf(intermediateToken) > -1) {
                const secondHops = poolsForTokenTo
                    .filter((secondPool) => secondPool.otherToken === intermediateToken)
                    .map((secondPool) => [firstPool.address, secondPool.address]);
                paths.push(...secondHops);
            }
        });
        if (paths.length > 0) {
            walks[internalPathId] = paths;
        }
    });
    return walks;
}
function getInternalRouteId(tokenA, tokenB, sort = true) {
    const mints = [common_sdk_1.AddressUtil.toString(tokenA), common_sdk_1.AddressUtil.toString(tokenB)];
    const sortedMints = sort ? mints.sort() : mints;
    return `${sortedMints[0]}${pool_graph_utils_1.PoolGraphUtils.PATH_ID_DELIMITER}${sortedMints[1]}`;
}
function combinations2(array) {
    const result = [];
    for (let i = 0; i < array.length - 1; i++) {
        for (let j = i + 1; j < array.length; j++) {
            result.push([array[i], array[j]]);
        }
    }
    return result;
}
//# sourceMappingURL=adjacency-list-pool-graph.js.map