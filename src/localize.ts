import { config, type l10nJsonFormat } from "@vscode/l10n";
import type { PathLike } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { env, type ExtensionContext } from "vscode";

const _encoding: BufferEncoding = "utf8";
const _nonWordRegexp = /\W+/;

async function importJSON<T extends l10nJsonFormat>(path: PathLike): Promise<T | void> {
  try { return JSON.parse(await readFile(path, _encoding)); }
  catch { return; }
}

export async function localize(context: ExtensionContext) {
  const bundleDir: string | undefined = context.extension.packageJSON.l10n;
  const firstLanguagePart = env.language.split(_nonWordRegexp).at(0);

  const contents: string | l10nJsonFormat = Object.assign({}, ...await Promise.all([
    importJSON(context.asAbsolutePath("package.nls.json")),
    ...firstLanguagePart ? [importJSON(context.asAbsolutePath(`package.nls.${firstLanguagePart}.json`))] : [],
    importJSON(context.asAbsolutePath(`package.nls.${env.language}.json`)),
  ].concat(...bundleDir ? [
    importJSON(context.asAbsolutePath(join(bundleDir, "bundle.l10n.json"))),
    ...firstLanguagePart ? [importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${firstLanguagePart}.json`)))] : [],
    importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${env.language}.json`))),
  ] : [])));

  config({ contents });
}
