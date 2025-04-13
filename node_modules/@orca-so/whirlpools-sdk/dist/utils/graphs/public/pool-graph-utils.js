"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolGraphUtils = void 0;
const common_sdk_1 = require("@orca-so/common-sdk");
class PoolGraphUtils {
    static PATH_ID_DELIMITER = "-";
    static getSearchPathId(tokenA, tokenB) {
        return `${common_sdk_1.AddressUtil.toString(tokenA)}${PoolGraphUtils.PATH_ID_DELIMITER}${common_sdk_1.AddressUtil.toString(tokenB)}`;
    }
    static deconstructPathId(pathId) {
        const split = pathId.split(PoolGraphUtils.PATH_ID_DELIMITER);
        if (split.length !== 2) {
            throw new Error(`Invalid path id: ${pathId}`);
        }
        const [tokenA, tokenB] = split;
        return [tokenA, tokenB];
    }
}
exports.PoolGraphUtils = PoolGraphUtils;
//# sourceMappingURL=pool-graph-utils.js.map