import { config, type l10nJsonFormat } from "@vscode/l10n";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { env, type ExtensionContext } from "vscode";

async function importJSON<T extends l10nJsonFormat>(path: string): Promise<T> {
  if (existsSync(path))
    try { return JSON.parse(await readFile(path, "utf8")); } catch { }

  return <T>{};
}

export async function localize(context: ExtensionContext) {
  const firstLanguagePart = env.language.split(/\W+/)[0];
  const bundleDir: string = context.extension.packageJSON.l10n;

  config({
    contents: Object.assign({}, ...await Promise.all([
      importJSON(context.asAbsolutePath("package.nls.json")),
      importJSON(context.asAbsolutePath(`package.nls.${firstLanguagePart}.json`)),
      importJSON(context.asAbsolutePath(`package.nls.${env.language}.json`)),
    ].concat(bundleDir ? [
      importJSON(context.asAbsolutePath(join(bundleDir, "bundle.l10n.json"))),
      importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${firstLanguagePart}.json`))),
      importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${env.language}.json`))),
    ] : []))),
  });
}
