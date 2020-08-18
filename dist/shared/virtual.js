"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const webpack_virtual_modules_1 = tslib_1.__importDefault(require("webpack-virtual-modules"));
const CWD = process.cwd();
const virtualModulesByCompiler = new WeakMap();
function registerVirtualModules(compiler, virtualModules) {
    virtualModules.apply(compiler);
    virtualModulesByCompiler.set(compiler, virtualModules);
}
exports.registerVirtualModules = registerVirtualModules;
function getVirtualModules(compiler) {
    let virtualModules = virtualModulesByCompiler.get(compiler);
    if (!virtualModules) {
        virtualModules = new webpack_virtual_modules_1.default();
        virtualModules.apply(compiler);
        virtualModulesByCompiler.set(compiler, virtualModules);
        // When we're in this branch, it's because the loader is adding this plugin after the compilation has started
        // This means that we missed the afterEnvironmentHook where the VirtualModulesPlugin setup the writeModule method
        // Since the plugin doesn't work unless this function is called, we'll call it manually
        const taps = compiler.hooks.afterEnvironment.taps;
        const hook = taps.find(({ name }) => name === "VirtualModulesPlugin");
        hook.fn();
    }
    return virtualModules;
}
exports.getVirtualModules = getVirtualModules;
exports.VIRTUAL_BROWSER_INVALIDATE_PATH = path_1.default.join(CWD, "__MARKO_WEBPACK_INVALIDATE__.js");
exports.VIRTUAL_SERVER_MANIFEST_PATH = path_1.default.join(CWD, "__MARKO_WEBPACK__MANIFEST.js");
//# sourceMappingURL=virtual.js.map