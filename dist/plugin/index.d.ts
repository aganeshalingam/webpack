import { Compiler } from "webpack";
export default class MarkoWebpackPlugin {
    private options?;
    private serverIsBuilding;
    private browserCompilerNames;
    private pendingBrowserBuilds;
    private pendingFinishModules;
    private clientEntries;
    private clientAssets;
    private virtualServerModules;
    constructor(options?: {
        runtimeId?: string;
    });
    private invalidateBrowserBuild;
    private invalidateServerBuild;
    get server(): (compiler: Compiler) => void;
    get browser(): (compiler: Compiler) => void;
}
