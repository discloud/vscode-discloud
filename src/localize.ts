import { config } from "@vscode/l10n";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { env } from "vscode";

function importJSON<T = any>(path: string): T {
  try {
    if (!isAbsolute(path))
      path = join(__dirname, path);

    if (existsSync(path))
      return JSON.parse(readFileSync(path, "utf8"));

    return <T>{};
  } catch {
    return <T>{};
  }
}

const bundleDir = join("..", "l10n");
const packageDir = join("..");

config({
  contents: Object.assign({},
    importJSON(join(packageDir, "package.nls.json")),
    importJSON(join(packageDir, `package.nls.${env.language.split(/\W+/)[0]}.json`)),
    importJSON(join(packageDir, `package.nls.${env.language}.json`)),
    importJSON(join(bundleDir, "bundle.l10n.json")),
    importJSON(join(bundleDir, `bundle.l10n.${env.language.split(/\W+/)[0]}.json`)),
    importJSON(join(bundleDir, `bundle.l10n.${env.language}.json`)),
  ),
});
