import { config } from "@vscode/l10n";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { env, type ExtensionContext } from "vscode";

function importJSON<T>(path: string): T {
  try {
    if (existsSync(path)) 
      return JSON.parse(readFileSync(path, "utf8"));

    return <T>{};
  } catch {
    return <T>{};
  }
}

const bundleDir = "l10n";

export function localize(context: ExtensionContext) {
  config({
    contents: Object.assign({},
      importJSON(context.asAbsolutePath("package.nls.json")),
      importJSON(context.asAbsolutePath(`package.nls.${env.language.split(/\W+/)[0]}.json`)),
      importJSON(context.asAbsolutePath(`package.nls.${env.language}.json`)),
      importJSON(context.asAbsolutePath(join(bundleDir, "bundle.l10n.json"))),
      importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${env.language.split(/\W+/)[0]}.json`))),
      importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${env.language}.json`))),
    ),
  });
}
