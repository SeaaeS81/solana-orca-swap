"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhirlpoolRouterBuilder = void 0;
const public_1 = require("../../utils/public");
const router_impl_1 = require("../router-impl");
class WhirlpoolRouterBuilder {
    static buildWithPoolGraph(ctx, graph) {
        return new router_impl_1.WhirlpoolRouterImpl(ctx, graph);
    }
    static async buildWithPools(ctx, pools) {
        const poolGraph = await public_1.PoolGraphBuilder.buildPoolGraphWithFetch(pools, ctx.fetcher);
        return new router_impl_1.WhirlpoolRouterImpl(ctx, poolGraph);
    }
}
exports.WhirlpoolRouterBuilder = WhirlpoolRouterBuilder;
//# sourceMappingURL=router-builder.js.map