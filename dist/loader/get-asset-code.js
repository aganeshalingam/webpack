"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const module_name_1 = tslib_1.__importDefault(require("../shared/module-name"));
const virtual_1 = require("../shared/virtual");
exports.default = (resourcePath, runtimeId, publicPath) => `
import template from ${JSON.stringify(`./${path.basename(resourcePath)}`)};
import manifest from ${JSON.stringify(`./${path.relative(path.dirname(resourcePath), virtual_1.VIRTUAL_SERVER_MANIFEST_PATH)}`)};

static function renderAssets() {
  const assets = this.___assets;
  const nonce = this.global.cspNonce;
  this.___renderAssets = this.___assets = undefined;
  this.flush = this.___flush;
  this.end = this.___end;

  if (assets) {
    ${publicPath === undefined
    ? `__webpack_public_path__ && this.script(\`${runtimeId ? `$mwp_${runtimeId}` : "$mwp"}=\${JSON.stringify(__webpack_public_path__)}\`);`
    : ""}

    if (assets.js) {
      const nonceAttr = nonce ? \` nonce=\${JSON.stringify(nonce)}\` : "";
      assets.js.forEach(js => {
        this.write(
          \`<script src=\${JSON.stringify(__webpack_public_path__+js)}\${nonceAttr} async></script>\`
        );
      });
    }

    if (assets.css) {
      assets.css.forEach(css => {
        this.write(
          \`<link rel="stylesheet" href=\${JSON.stringify(__webpack_public_path__+css)}>\`
        );
      });
    }
  }
}

static function outFlushOverride() {
  this.___renderAssets();
  this.flush();
}

static function outEndOverride(data, encoding, callback) {
  this.___renderAssets();
  this.end(data, encoding, callback);
}

${runtimeId === undefined
    ? ""
    : `$ out.global.runtimeId = ${JSON.stringify(runtimeId)};`}
$ out.___flush = out.flush;
$ out.___end = out.end;
$ out.___renderAssets = renderAssets;
$ out.___assets = manifest.getAssets(${JSON.stringify(module_name_1.default(resourcePath))}, out.global.buildName);
$ out.flush = outFlushOverride;
$ out.end = outEndOverride;

<\${template} ...input/>
<init-components/>
<await-reorderer/>
`;
//# sourceMappingURL=get-asset-code.js.map