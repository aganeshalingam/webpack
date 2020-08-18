import { Compiler, Entry, EntryFunc } from "webpack";
declare type EntryType = string | string[] | Entry | EntryFunc;
interface InjectType {
    file: string;
    filter: string | RegExp | ((name: string) => boolean);
    index: number;
}
interface NamedEntries {
    [_: string]: EntryType;
}
export default class WebpackPluginAddEntries {
    addNamed: NamedEntries | (() => NamedEntries | Promise<NamedEntries>);
    addToEach: InjectType[];
    defaultEntry: boolean;
    constructor({ addNamed, addToEach, defaultEntry }?: {
        addNamed?: {};
        addToEach?: any[];
        defaultEntry?: boolean;
    });
    apply(compiler: Compiler): void;
    private injectNamedEntries;
    private injectNamedToEntriesObject;
    private injectToAllEntries;
}
export {};
