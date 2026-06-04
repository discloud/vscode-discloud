import { config, type l10nJsonFormat } from "@vscode/l10n";
import { open } from "fs/promises";
import { join } from "path";
import { env, type ExtensionContext } from "vscode";

const localizationContentsCache = new Map<string, l10nJsonFormat>();

async function importJSON<T extends l10nJsonFormat>(path: string): Promise<T> {
  try {
    const fileHandle = await open(path);
    const content = await fileHandle.readFile("utf8");
    await fileHandle.close();
    return JSON.parse(content);
  } catch { }

  return <T>{};
}

function getLocaleCandidates(locale = env.language) {
  const normalizedLocale = locale.trim();
  const lowerCasedLocale = normalizedLocale.toLowerCase();
  const firstLanguagePart = lowerCasedLocale.split(/\W+/)[0];

  return {
    cacheKey: lowerCasedLocale || "default",
    locale: lowerCasedLocale,
    firstLanguagePart,
  };
}

async function getLocalizationContents(context: ExtensionContext, locale = env.language) {
  const { cacheKey, locale: normalizedLocale, firstLanguagePart } = getLocaleCandidates(locale);
  const cached = localizationContentsCache.get(cacheKey);

  if (cached) return cached;

  const bundleDir: string = context.extension.packageJSON.l10n;
  const contents = Object.assign({}, ...await Promise.all([
    importJSON(context.asAbsolutePath("package.nls.json")),
    importJSON(context.asAbsolutePath(`package.nls.${firstLanguagePart}.json`)),
    importJSON(context.asAbsolutePath(`package.nls.${normalizedLocale}.json`)),
  ].concat(bundleDir ? [
    importJSON(context.asAbsolutePath(join(bundleDir, "bundle.l10n.json"))),
    importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${firstLanguagePart}.json`))),
    importJSON(context.asAbsolutePath(join(bundleDir, `bundle.l10n.${normalizedLocale}.json`))),
  ] : [])));

  localizationContentsCache.set(cacheKey, contents);

  return contents;
}

export async function localize(context: ExtensionContext, locale = env.language) {
  config({
    contents: await getLocalizationContents(context, locale),
  });
}
