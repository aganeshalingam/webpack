"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const webpack_plugin_add_entries_1 = tslib_1.__importDefault(require("./webpack-plugin-add-entries"));
const webpack_sources_1 = require("webpack-sources");
const webpack_virtual_modules_1 = tslib_1.__importDefault(require("webpack-virtual-modules"));
const sort_keys_1 = tslib_1.__importDefault(require("sort-keys"));
const module_name_1 = tslib_1.__importDefault(require("../shared/module-name"));
const plugin_options_for_compiler_1 = tslib_1.__importDefault(require("../shared/plugin-options-for-compiler"));
const virtual_1 = require("../shared/virtual");
const MANIFEST_MARKER = "$__MARKO_MANIFEST__$";
const MANIFEST_CONTENT = `module.exports = ${MANIFEST_MARKER}`;
class MarkoWebpackPlugin {
    constructor(options) {
        this.options = options;
        this.serverIsBuilding = true;
        this.browserCompilerNames = [];
        this.pendingBrowserBuilds = [];
        this.pendingFinishModules = createDeferredPromise();
        this.clientEntries = {};
        this.clientAssets = {};
        this.virtualServerModules = new webpack_virtual_modules_1.default({
            [virtual_1.VIRTUAL_SERVER_MANIFEST_PATH]: MANIFEST_CONTENT
        });
        this.options = options;
    }
    // Overwritten by each compiler.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    invalidateBrowserBuild() { }
    invalidateServerBuild() {
        if (!this.serverIsBuilding) {
            this.virtualServerModules.writeModule(virtual_1.VIRTUAL_SERVER_MANIFEST_PATH, MANIFEST_CONTENT);
        }
    }
    get server() {
        return (compiler) => {
            const entryTemplates = new Set();
            const isEvalDevtool = String(compiler.options.devtool).includes("eval");
            const escapeIfEval = (code) => isEvalDevtool ? JSON.stringify(code).slice(1, -1) : code;
            plugin_options_for_compiler_1.default.set(compiler, this.options);
            applyRuntimeIdOptions(this.options, compiler.options.output);
            virtual_1.registerVirtualModules(compiler, this.virtualServerModules);
            compiler.hooks.invalid.tap("MarkoWebpackServer:invalid", () => {
                this.serverIsBuilding = true;
                this.pendingFinishModules = createDeferredPromise();
            });
            compiler.hooks.normalModuleFactory.tap("MarkoWebpackServer:normalModuleFactory", normalModuleFactory => {
                normalModuleFactory.hooks.beforeResolve.tap("MarkoWebpackServer:resolver", data => {
                    if (data.request.endsWith(".marko") &&
                        (!data.contextInfo.issuer ||
                            (data.contextInfo.issuer.endsWith(".js") && !data.contextInfo.issuer.includes("arc-webpack/index.js")))) {
                        if (compiler.options.name === "Server") {
                            console.log("top level template", data.request, data.contextInfo.issuer);
                        }
                        data.request = data.request + "?assets";
                    }
                });
            });
            compiler.hooks.thisCompilation.tap("MarkoWebpackServer:compilation", compilation => {
                compilation.hooks.normalModuleLoader.tap("MarkoWebpackServer:normalModuleLoader", (_, mod) => {
                    const resource = mod
                        .resource;
                    if (resource.endsWith(".marko?assets")) {
                        entryTemplates.add(resource.replace(/\.marko\?assets$/, ".marko"));
                    }
                });
                compilation.hooks.finishModules.tap("MarkoWebpackServer:finishModules", () => {
                    let hasChanged = false;
                    for (const filename of entryTemplates) {
                        const moduleNameForFile = module_name_1.default(filename);
                        if (this.clientEntries[moduleNameForFile]) {
                            try {
                                if (!compilation.inputFileSystem.statSync(filename).isFile()) {
                                    throw new Error();
                                }
                            }
                            catch (_a) {
                                // entry was removed.
                                hasChanged = true;
                                entryTemplates.delete(filename);
                                delete this.clientEntries[moduleNameForFile];
                            }
                        }
                        else {
                            // new entry.
                            hasChanged = true;
                            this.clientEntries[moduleNameForFile] = filename + "?hydrate";
                        }
                    }
                    if (hasChanged) {
                        this.invalidateBrowserBuild();
                    }
                    this.pendingFinishModules.resolve();
                });
                compilation.hooks.optimizeChunkAssets.tapPromise("MarkoWebpackServer:optimizeChunkAssets", async () => {
                    await Promise.all(this.pendingBrowserBuilds);
                    const clientAssets = sort_keys_1.default(this.clientAssets, { deep: true });
                    this.pendingBrowserBuilds = [];
                    this.serverIsBuilding = false;
                    for (const filename in compilation.assets) {
                        if (filename.endsWith(".js")) {
                            const originalSource = compilation.assets[filename].source();
                            const placeholder = escapeIfEval(MANIFEST_MARKER);
                            const placeholderPosition = originalSource.indexOf(placeholder);
                            if (placeholderPosition > -1) {
                                const hasMultipleBuilds = this.browserCompilerNames.length > 1;
                                const content = escapeIfEval(hasMultipleBuilds
                                    ? `{
  getAssets(entry, buildName) {
    const buildAssets = this.builds[buildName];
    if (!buildAssets) {
      throw new Error("Unable to load assets for build with a '$global.buildName' of '" + buildName + "'.");
    }

    return buildAssets[entry];
  },
  builds: ${JSON.stringify(clientAssets)}
}`
                                    : `{
  getAssets(entry) {
    return this.build[entry];
  },
  build: ${JSON.stringify(clientAssets[this.browserCompilerNames[0]])}
}`);
                                const newSource = new webpack_sources_1.ReplaceSource(compilation.assets[filename], filename);
                                newSource.replace(placeholderPosition, placeholderPosition + placeholder.length - 1, content);
                                compilation.assets[filename] = newSource;
                            }
                        }
                    }
                });
            });
        };
    }
    get browser() {
        return (compiler) => {
            let pendingBuild = createDeferredPromise();
            const compilerName = compiler.options.name;
            const virtualModules = new webpack_virtual_modules_1.default({
                [virtual_1.VIRTUAL_BROWSER_INVALIDATE_PATH]: ""
            });
            plugin_options_for_compiler_1.default.set(compiler, this.options);
            applyRuntimeIdOptions(this.options, compiler.options.output);
            virtual_1.registerVirtualModules(compiler, virtualModules);
            this.browserCompilerNames.push(compilerName);
            this.pendingBrowserBuilds.push(pendingBuild);
            compiler.hooks.watchRun.tap("MarkoWebpackBrowser:watch", () => {
                const { invalidateBrowserBuild } = this;
                this.clientEntries.__INVALIDATE__ = virtual_1.VIRTUAL_BROWSER_INVALIDATE_PATH;
                // eslint-disable-next-line @typescript-eslint/unbound-method
                this.invalidateBrowserBuild = () => {
                    if (pendingBuild !== undefined) {
                        virtualModules.writeModule(virtual_1.VIRTUAL_BROWSER_INVALIDATE_PATH, "");
                    }
                    invalidateBrowserBuild();
                };
            });
            compiler.hooks.invalid.tap("MarkoWebpackBrowser:invalid", () => {
                this.invalidateServerBuild();
                pendingBuild = createDeferredPromise();
                this.pendingBrowserBuilds.push(pendingBuild);
            });
            compiler.hooks.done.tap("MarkoWebpackBrowser:done", ({ compilation }) => {
                for (const [entryName, { chunks }] of compilation.entrypoints) {
                    const assetsByType = {};
                    for (const { files } of chunks) {
                        if (files) {
                            for (const asset of files) {
                                const ext = path_1.default.extname(asset).slice(1);
                                const type = (assetsByType[ext] = assetsByType[ext] || []);
                                type.push(asset);
                            }
                        }
                    }
                    const buildAssets = (this.clientAssets[compilerName] =
                        this.clientAssets[compilerName] || {});
                    buildAssets[entryName] = assetsByType;
                }
                pendingBuild.resolve();
                pendingBuild = undefined;
            });
            new webpack_plugin_add_entries_1.default({
                addNamed: () => this.pendingFinishModules.then(() => this.clientEntries)
            }).apply(compiler);
        };
    }
}
exports.default = MarkoWebpackPlugin;
function createDeferredPromise() {
    let resolve;
    const promise = new Promise(_resolve => (resolve = _resolve));
    // eslint-disable-next-line @typescript-eslint/unbound-method
    promise.resolve = resolve;
    return promise;
}
function applyRuntimeIdOptions(pluginOptions, outputOptions) {
    if (pluginOptions && pluginOptions.runtimeId) {
        const { runtimeId } = pluginOptions;
        if (outputOptions.hotUpdateFunction === "webpackHotUpdate") {
            outputOptions.hotUpdateFunction = `${runtimeId}HotUpdate`;
        }
        if (outputOptions.jsonpFunction === "webpackJsonp") {
            outputOptions.jsonpFunction = `${runtimeId}Jsonp`;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (outputOptions.chunkCallbackName === "webpackChunk") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            outputOptions.chunkCallbackName = `${runtimeId}Chunk`;
        }
    }
}
//# sourceMappingURL=index.js.map
