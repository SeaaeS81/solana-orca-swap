import type { Address } from "@coral-xyz/anchor";
import type { WhirlpoolRouter } from ".";
import type { WhirlpoolContext } from "../..";
import type { PoolGraph } from "../../utils/public";
export declare class WhirlpoolRouterBuilder {
    static buildWithPoolGraph(ctx: WhirlpoolContext, graph: PoolGraph): WhirlpoolRouter;
    static buildWithPools(ctx: WhirlpoolContext, pools: Address[]): Promise<WhirlpoolRouter>;
}
