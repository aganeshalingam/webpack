"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DEFAULT_INDEX = -1;
const DEFAULT_ENTRY_NAME = "main";
const DEFAULT_ENTRY_VALUE = "./src";
class WebpackPluginAddEntries {
    constructor({ addNamed = {}, addToEach = [], defaultEntry = false } = {}) {
        this.addNamed = addNamed;
        this.addToEach = addToEach.map(entry => {
            if (typeof entry === "string") {
                entry = { file: entry };
            }
            return entry;
        });
        this.defaultEntry = defaultEntry;
    }
    apply(compiler) {
        if (typeof this.addNamed === "function" ||
            Object.keys(this.addNamed).length) {
            compiler.options.entry = this.injectNamedEntries(compiler.options.entry);
        }
        if (this.addToEach.length) {
            compiler.options.entry = this.injectToAllEntries("", compiler.options.entry);
        }
    }
    injectNamedEntries(currentEntry) {
        const namedEntries = this.addNamed;
        if (typeof namedEntries === "function") {
            return () => {
                const calculatedEntries = namedEntries();
                if (calculatedEntries instanceof Promise) {
                    return calculatedEntries.then(resolvedEntries => this.injectNamedToEntriesObject(currentEntry, resolvedEntries));
                }
                else {
                    return this.injectNamedToEntriesObject(currentEntry, calculatedEntries);
                }
            };
        }
        else {
            return this.injectNamedToEntriesObject(currentEntry, namedEntries);
        }
    }
    injectNamedToEntriesObject(currentEntry, namedEntries) {
        if (currentEntry === DEFAULT_ENTRY_VALUE && !this.defaultEntry) {
            return Object.assign({}, namedEntries);
        }
        else if (typeof currentEntry === "string" ||
            Array.isArray(currentEntry)) {
            return Object.assign({ [DEFAULT_ENTRY_NAME]: currentEntry }, namedEntries);
        }
        else if (typeof currentEntry === "function") {
            return () => this.injectNamedToEntriesObject(currentEntry(), namedEntries);
        }
        else if (typeof currentEntry.then === "function") {
            return currentEntry.then(entry => this.injectNamedToEntriesObject(entry, namedEntries));
        }
        else if (currentEntry === Object(currentEntry)) {
            return Object.assign({}, currentEntry, namedEntries);
        }
    }
    injectToAllEntries(entryName, currentEntry) {
        if (typeof currentEntry === "string" || Array.isArray(currentEntry)) {
            const newEntry = [].concat(currentEntry);
            this.addToEach.forEach(entry => {
                if (entry.filter != null) {
                    const name = entryName || DEFAULT_ENTRY_NAME;
                    if ((entry.filter instanceof RegExp && !entry.filter.test(name)) ||
                        (typeof entry.filter === "function" && !entry.filter(name)) ||
                        (typeof entry.filter === "string" && entry.filter !== name)) {
                        return;
                    }
                }
                const index = entry.index != null ? entry.index : DEFAULT_INDEX;
                newEntry.splice(index, 0, entry.file);
            });
            return newEntry;
        }
        else if (typeof currentEntry === "function") {
            return () => this.injectToAllEntries(entryName, currentEntry());
        }
        else if (typeof currentEntry.then === "function") {
            return currentEntry.then(entry => this.injectToAllEntries(entryName, entry));
        }
        else if (currentEntry === Object(currentEntry)) {
            currentEntry = Object.assign({}, currentEntry);
            Object.keys(currentEntry).forEach(entryName => {
                currentEntry[entryName] = this.injectToAllEntries(entryName, currentEntry[entryName]);
            });
            return currentEntry;
        }
    }
}
exports.default = WebpackPluginAddEntries;
//# sourceMappingURL=webpack-plugin-add-entries.js.map