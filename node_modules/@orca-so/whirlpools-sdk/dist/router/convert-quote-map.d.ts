import type { RoutingOptions, TradeRoute } from "./public";
import type { SanitizedQuoteMap } from "./quote-map";
export declare function getBestRoutesFromQuoteMap(quoteMap: SanitizedQuoteMap, amountSpecifiedIsInput: boolean, opts: RoutingOptions): TradeRoute[];
