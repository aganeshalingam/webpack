"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const KEY = "CODE";
function encodeAsHexString(string) {
    return buffer_1.Buffer.from(string).toString("hex");
}
function decodeHexString(string) {
    return buffer_1.Buffer.from(string, "hex").toString();
}
function encode(code) {
    return `${KEY}=${encodeAsHexString(code)}`;
}
exports.encode = encode;
function decode(loaderOptions) {
    return decodeHexString(loaderOptions[KEY]);
}
exports.decode = decode;
//# sourceMappingURL=interface.js.map