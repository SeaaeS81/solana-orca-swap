import type { Address } from "@coral-xyz/anchor";
import type { DecimalsMap, PoolMap, PriceCalculationData, PriceMap, TickArrayMap } from ".";
import type { WhirlpoolAccountFetchOptions, WhirlpoolAccountFetcherInterface } from "../network/public/fetcher";
export declare class PriceModule {
    static fetchTokenPricesByMints(fetcher: WhirlpoolAccountFetcherInterface, mints: Address[], config?: import(".").GetPricesConfig, thresholdConfig?: import(".").GetPricesThresholdConfig, opts?: import("@orca-so/common-sdk").SimpleAccountFetchOptions, availableData?: Partial<PriceCalculationData>): Promise<PriceMap>;
    static fetchTokenPricesByPools(fetcher: WhirlpoolAccountFetcherInterface, pools: Address[], config?: import(".").GetPricesConfig, thresholdConfig?: import(".").GetPricesThresholdConfig, opts?: WhirlpoolAccountFetchOptions): Promise<PriceMap>;
    static calculateTokenPrices(mints: Address[], priceCalcData: PriceCalculationData, config?: import(".").GetPricesConfig, thresholdConfig?: import(".").GetPricesThresholdConfig): PriceMap;
}
export declare class PriceModuleUtils {
    static fetchPoolDataFromMints(fetcher: WhirlpoolAccountFetcherInterface, mints: Address[], config?: import(".").GetPricesConfig, opts?: import("@orca-so/common-sdk").SimpleAccountFetchOptions): Promise<PoolMap>;
    static fetchTickArraysForPools(fetcher: WhirlpoolAccountFetcherInterface, pools: PoolMap, config?: import(".").GetPricesConfig, opts?: WhirlpoolAccountFetchOptions): Promise<TickArrayMap>;
    static fetchDecimalsForMints(fetcher: WhirlpoolAccountFetcherInterface, mints: Address[], opts?: import("@orca-so/common-sdk").SimpleAccountFetchOptions): Promise<DecimalsMap>;
}
