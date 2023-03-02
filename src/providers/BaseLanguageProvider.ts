import { readFileSync } from "node:fs";
import { TextDocument } from "vscode";
import { LanguageConfig, ProviderOptions } from "../@types";
import extension from "../extension";

export default class BaseLanguageProvider {
  declare data: LanguageConfig;

  constructor(public options: ProviderOptions) {
    if ("path" in options) {
      try {
        this.data = JSON.parse(readFileSync(extension.context.asAbsolutePath(`${options.path}`), "utf8"));
      } catch (error: any) {
        extension.logger.error(error);
        return;
      }
    } else {
      extension.logger.error("Missing options.path");
      return;
    }
  }

  getText(document: TextDocument, pattern: string | RegExp) {
    pattern = RegExp(pattern);

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i);

      if (pattern.test(lineText.text))
        return lineText.text.split(this.data.rules.separator)[1];
    }
  }
}