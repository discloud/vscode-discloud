import { config } from "@vscode/l10n";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "vscode";

function importJSON(path: string) {
  try {
    if (existsSync(path))
      return JSON.parse(readFileSync(path, "utf8"));

    return {};
  } catch {
    return {};
  }
}

const bundleDir = join(__dirname, "..", "l10n");
const packageDir = join(__dirname, "..");

config({
  contents: {
    ...importJSON(join(packageDir, "package.nls.json")),
    ...importJSON(join(packageDir, `package.nls.${env.language.split(/\W+/)[0]}.json`)),
    ...importJSON(join(packageDir, `package.nls.${env.language}.json`)),
    ...importJSON(join(bundleDir, "bundle.l10n.json")),
    ...importJSON(join(bundleDir, `bundle.l10n.${env.language.split(/\W+/)[0]}.json`)),
    ...importJSON(join(bundleDir, `bundle.l10n.${env.language}.json`)),
  },
});
