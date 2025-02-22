import { config, type l10nJsonFormat } from "@vscode/l10n";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { env, type ExtensionContext } from "vscode";

function importJSON<T extends l10nJsonFormat>(path: string): T {
  try {
    if (existsSync(path))
      return JSON.parse(readFileSync(path, "utf8"));
  } catch { }

  return <T>{};
}

export function localize(context: ExtensionContext) {
  const firstLanguagePart = env.language.split(/\W+/)[0];
  const bundleDir: string = context.extension.packageJSON.l10n;

  config({
    contents: Object.assign({},
      importJSON(context.asAbsolutePath("package.nls.json")),
      importJSON(context.asAbsolutePath(`package.nls.${firstLanguagePart}.json`)),
      importJSON(context.asAbsolutePath(`package.nls.${env.language}.json`)),
      ...bundleDir ? [
        importJSON(context.asAbsolutePath(join(bundleDir, "bundle.l10n.json"))),
        importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${firstLanguagePart}.json`))),
        importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${env.language}.json`))),
      ] : [],
    ),
  });
}
