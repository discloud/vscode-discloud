import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { CompletionItem, CompletionItemKind, languages } from "vscode";
import { ProviderOptions } from "../@types";
import extension from "../extension";
import BaseLanguageProvider from "./BaseLanguageProvider";

export default class CompletionItemProvider extends BaseLanguageProvider {
  constructor(options: ProviderOptions) {
    super(options);

    if (!this.data) return;

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

          return files.map(file => {
            const item = new CompletionItem(file.name,
              file.isFile() ?
                CompletionItemKind.File :
                CompletionItemKind.Folder
            );

            item.sortText = `${file.isFile()}`;

            return item;
          });
        }

        if ("properties" in this.data[key]) {
          const values = value.split(RegExp(scopeData.separatorPattern));

          return scopeData.properties
            .filter(p => !values.includes(p))
            .map(value => new CompletionItem(value, CompletionItemKind[scopeData.completionItemKind]));
        }

        return [];
      },
    });

    extension.subscriptions.push(disposable);
  }
}
