import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CompletionItem, CompletionItemKind, languages, TextDocument } from "vscode";
import { LanguageConfig, ProviderOptions } from "../@types";
import extension from "../extension";

export default class CompletionItemProvider {
  data = <LanguageConfig>{};

  constructor(options: ProviderOptions) {
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

    const disposable = languages.registerCompletionItemProvider(this.data.rules.languageId, {
      provideCompletionItems: (document, position, _token, _context) => {
        if (!position.character)
          return this.data.rules.scopes.map(scope => new CompletionItem(`${scope}${this.data.rules.separator}`, CompletionItemKind.Value))
            .concat(new CompletionItem("# https://docs.discloudbot.com/discloud.config", CompletionItemKind.Reference));

        const textLine = document.lineAt(position);
        const text = textLine.text.substring(0, position.character);
        const [key, value] = text.split(this.data.rules.separator);

        if (typeof value !== "string") {
          if (this.data.rules.scopes.includes(key))
            return [new CompletionItem(`${key}${this.data.rules.separator}`, CompletionItemKind.Value)];

          return this.data.rules.scopes
            .filter(scope => scope.includes(key))
            .map(scope => new CompletionItem(`${scope}${this.data.rules.separator}`, CompletionItemKind.Value));
        }

        const scopeData = this.data[key];

        if (!scopeData) return [];

        if ("minValue" in this.data[key]) {
          const TYPE = this.getText(document, `^${scopeData.minValue.compare}${this.data.rules.separator}`);

          const keys = Object.keys(scopeData.minValue.when);

          const type = keys.find(key => key === TYPE) ?? "all";

          const min = scopeData.minValue.when[type];

          const values = min.values ?? [min.value];

          return values.map(v => new CompletionItem(`${v}`, CompletionItemKind[scopeData.completionItemKind]));
        }

        if ("fs" in this.data[key]) {
          let targetPath = join(dirname(document.uri.fsPath), value);

          while (targetPath && !existsSync(targetPath)) {
            targetPath = dirname(targetPath);
          }
          if (!targetPath) return [];

          const files = readdirSync(targetPath, { withFileTypes: true });

          return files.map(file => new CompletionItem(file.name,
            file.isFile() ?
              CompletionItemKind.File :
              CompletionItemKind.Folder
          ));
        }

        if ("properties" in this.data[key]) {
          return scopeData.properties.map(value => new CompletionItem(value, CompletionItemKind[scopeData.completionItemKind]));
        }

        return [];
      },
    });

    extension.context.subscriptions.push(disposable);
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
