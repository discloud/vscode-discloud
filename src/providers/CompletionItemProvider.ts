import { APT, APTPackages } from "discloud.app";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { CompletionItem, CompletionItemKind, languages, TextDocument, TextLine } from "vscode";
import extension from "../extension";
import { DiscloudConfigScopes } from "../util";

export default class CompletionItemProvider {
  constructor() {
    const disposable = languages.registerCompletionItemProvider("discloud.config", {
      provideCompletionItems(document, position, token, context) {
        if (!position.character)
          return DiscloudConfigScopes.map(scope => new CompletionItem(`${scope}=`, CompletionItemKind.Value))
            .concat(new CompletionItem("# https://docs.discloudbot.com/discloud.config", CompletionItemKind.Reference));

        const textLine: TextLine = document.lineAt(position);
        const text = textLine.text.substring(0, position.character);
        const splitted = text.split("=");

        if (splitted.length === 1) {
          if (DiscloudConfigScopes.includes(splitted[0]))
            return [new CompletionItem(`${splitted[0]}=`, CompletionItemKind.Value)];

          return DiscloudConfigScopes
            .filter(scope => scope.includes(splitted[0]))
            .map(scope => new CompletionItem(`${scope}=`, CompletionItemKind.Value));
        }

        return CompletionItemProvider[<"MAIN">splitted[0]]?.(splitted[1], document);
      },
    });

    extension.context.subscriptions.push(disposable);
  }

  static APT(text: string) {
    const pkgs = text.split(",");

    return APTPackages
      .filter(pkg => !pkgs.includes(pkg))
      .map(pkg => new CompletionItem({
        label: pkg,
        description: APT[pkg].join(", "),
      }, CompletionItemKind.Value));
  }

  static AUTORESTART() {
    return [
      new CompletionItem("false", CompletionItemKind.Keyword),
      new CompletionItem("true", CompletionItemKind.Keyword),
    ];
  }

  static MAIN(text: string, document: TextDocument) {
    let targetPath = join(dirname(document.uri.fsPath), text);

    while (targetPath && !existsSync(targetPath)) {
      targetPath = dirname(targetPath);
    }
    if (!targetPath) return;

    const files = readdirSync(targetPath, { withFileTypes: true });

    return files.map(file => new CompletionItem(file.name, file.isFile() ? CompletionItemKind.File : CompletionItemKind.Folder));
  }

  static RAM(text: string, document: TextDocument) {
    const value = this.getText(document, /^TYPE=/);

    switch (value) {
      case "bot":
        return [new CompletionItem("100", CompletionItemKind.Unit)];
      case "site":
        return [new CompletionItem("512", CompletionItemKind.Unit)];
      default:
        return [
          new CompletionItem("100", CompletionItemKind.Unit),
          new CompletionItem("512", CompletionItemKind.Unit),
        ];
    }
  }

  static TYPE() {
    return [
      new CompletionItem("bot", CompletionItemKind.Constant),
      new CompletionItem("site", CompletionItemKind.Constant),
    ];
  }

  static VERSION() {
    return [
      new CompletionItem("latest", CompletionItemKind.Constant),
      new CompletionItem("current", CompletionItemKind.Constant),
      new CompletionItem("suja", CompletionItemKind.Constant),
    ];
  }

  static getText(document: TextDocument, pattern: string | RegExp) {
    pattern = RegExp(pattern);
    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i);
      if (pattern.test(lineText.text)) return lineText.text.split("=")[1];
    }
  }
}
