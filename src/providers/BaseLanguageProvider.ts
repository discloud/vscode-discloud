import { readFileSync } from "node:fs";
import { TextDocument } from "vscode";
import { LanguageConfig } from "../@types";
import extension from "../extension";

export default class BaseLanguageProvider {
  declare readonly data: LanguageConfig;

  constructor(path: string) {
    if (path) {
      try {
        this.data = JSON.parse(readFileSync(extension.context.asAbsolutePath(path), "utf8"));
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

    let text;

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i);

      if (pattern.test(lineText.text)) {
        text = lineText.text.split(this.data.rules.separator)[1];
        break;
      }
    }

    return text;
  }
}
