"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const base_x_1 = tslib_1.__importDefault(require("base-x"));
const crypto_1 = require("crypto");
const transport_1 = require("lasso-modules-client/transport");
const base62 = base_x_1.default("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
exports.default = (filename) => {
    const modulePath = transport_1.getClientPath(filename);
    const hasher = crypto_1.createHash("sha256");
    hasher.update(modulePath);
    const hash = base62.encode(hasher.digest()).slice(0, 4);
    const baseName = path_1.default.basename(filename);
    let name = baseName.slice(0, baseName.indexOf("."));
    if (name === "index" || name === "template") {
        name = path_1.default.basename(path_1.default.dirname(filename));
    }
    return name + "_" + hash;
};
//# sourceMappingURL=module-name.js.map