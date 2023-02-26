import { t } from "@vscode/l10n";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, Disposable, languages, Position, Range, TextDocument, window, workspace } from "vscode";
import { LanguageConfig, ProviderOptions } from "../@types";
import extension from "../extension";

export default class LanguageConfigurationProvider {
  data = <LanguageConfig>{};
  disposableDocuments: Disposable[] = [];
  declare collection: DiagnosticCollection;

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

    this.collection = languages.createDiagnosticCollection(this.data.rules.languageId);

    const disposableEditor = window.onDidChangeActiveTextEditor(editor => {
      if (editor?.document.languageId === this.data.rules.languageId) {
        this.checkDocument(editor.document);
        this.activate();
      } else {
        this.deactivate();
        this.collection.clear();
      }
    });

    if (window.activeTextEditor?.document.languageId === this.data.rules.languageId) {
      this.checkDocument(window.activeTextEditor.document);
      this.activate();
    }

    extension.context.subscriptions.push(this.collection, disposableEditor);
  }

  activate() {
    const disposable = workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === this.data.rules.languageId)
        for (const _ of event.contentChanges) {
          this.checkDocument(event.document);
        }
    });

    extension.context.subscriptions.push(disposable);
    this.disposableDocuments.push(disposable);
  }

  deactivate() {
    for (let i = 0; i < this.disposableDocuments.length;) {
      this.disposableDocuments.shift()?.dispose();
    }
  }

  checkDocument(document: TextDocument) {
    if (document.languageId !== this.data.rules.languageId) return;

    const diagnostics = <Diagnostic[]>[];

    const scopes: Record<string, any> = {};

    const ignore = RegExp(this.data.rules.ignore);

    for (let i = 0; i < document.lineCount; i++) {
      const textLine = document.lineAt(i);

      if (ignore.test(textLine.text)) continue;

      const keyAndValue = textLine.text.split(this.data.rules.separator);
      const key = keyAndValue[0];
      const value = keyAndValue[1];

      for (const keyOrValue of keyAndValue) {
        const isKey = keyOrValue === keyAndValue[0];

        const scopeData = this.data[keyAndValue[0]] ?? {};

        if (this.data.rules.noSpaces) {
          if (
            (this.data.rules.noEndSpaces && keyOrValue.endsWith(" ")) ||
            (!scopeData.allowSpaces && /\s+/.test(keyOrValue))
          ) {
            diagnostics.push({
              message: t(
                keyOrValue.endsWith(" ") ?
                  this.data.rules.noEndSpaces.message :
                  this.data.rules.noSpaces.message
              ),
              range: new Range(
                new Position(i, isKey ? 0 : (keyAndValue[0].length + 1)),
                new Position(i, isKey ? keyOrValue.length : textLine.text.length)
              ),
              severity: DiagnosticSeverity[this.data.rules.noSpaces.severity],
            });
          }
        }
      }

      if (value) {
        scopes[key] = value;

        for (const scope of this.data.rules.scopes) {
          if (key !== scope) continue;
          if (!(scope in this.data)) continue;

          const scopeData = this.data[scope];

          if ("fs" in scopeData) {
            if (extension.workspaceFolder) {
              if (!existsSync(join(extension.workspaceFolder, value))) {
                diagnostics.push({
                  message: t(scopeData.fs.message),
                  range: new Range(
                    new Position(i, key.length + 1),
                    new Position(i, textLine.text.length)
                  ),
                  severity: DiagnosticSeverity.Error,
                });
              }
            }
          }

          if ("minValue" in scopeData) {
            if (isNaN(Number(value))) {
              diagnostics.push({
                message: t(scopeData.message),
                range: new Range(
                  new Position(i, key.length + 1),
                  new Position(i, textLine.text.length)
                ),
                severity: DiagnosticSeverity.Error,
              });
            } else {
              const TYPE = this.getText(document, `^${scopeData.minValue.compare}${this.data.rules.separator}`);

              const keys = Object.keys(scopeData.minValue.when);

              const type = keys.find(key => key === TYPE) ?? "common";

              const min = scopeData.minValue.when[type].value;

              if (Number(value) < min) {
                diagnostics.push({
                  message: t(scopeData.minValue.message, {
                    min,
                  }),
                  range: new Range(
                    new Position(i, key.length + 1),
                    new Position(i, textLine.text.length)
                  ),
                  severity: DiagnosticSeverity.Error,
                });
              }
            }
          }

          if ("pattern" in scopeData) {
            if (!RegExp(scopeData.pattern).test(value)) {
              diagnostics.push({
                message: t(scopeData.message),
                range: new Range(
                  new Position(i, key.length + 1),
                  new Position(i, textLine.text.length)
                ),
                severity: DiagnosticSeverity.Error,
              });
            }
          }

          if ("separatorPattern" in scopeData) {
            const splitted = value.split(RegExp(scopeData.separatorPattern));

            if (splitted.length) {
              for (const data of splitted) {
                if (!data) continue;

                if (!RegExp(scopeData.pattern!).test(data)) {
                  diagnostics.push({
                    message: t(scopeData.message!),
                    range: new Range(
                      new Position(i, key.length + 1),
                      new Position(i, textLine.text.length)
                    ),
                    severity: DiagnosticSeverity.Error,
                  });
                }
              }
            }
          }
        }
      } else {
        if (!textLine.text.includes(this.data.rules.separator)) {
          diagnostics.push({
            message: t(this.data.rules.messages.missingseparator),
            range: new Range(
              new Position(i, key.length),
              new Position(i, textLine.text.length)
            ),
            severity: DiagnosticSeverity.Error,
          });
        }
      }
    }

    const missingScopes = this.getRequiredScopes(document)
      .filter((scope) => !scopes[scope]);

    if (missingScopes.length) {
      diagnostics.push({
        message: t(this.data.rules.messages.missingscopes, {
          scopes: `[${missingScopes.join(", ")}]`,
        }),
        range: new Range(
          new Position(0, 0),
          new Position(document.lineCount, 0)
        ),
        severity: DiagnosticSeverity.Error,
      });
    }

    this.updateDiagnostics(document, diagnostics);
  }

  updateDiagnostics(document: TextDocument, diagnostics: Diagnostic[]) {
    this.collection.set(document.uri, diagnostics);
  }

  getRequiredScopes(document: TextDocument) {
    return this.data.rules.scopes
      .filter(scope => {
        const required = this.data[scope].required;

        if (typeof required === "boolean") return required;

        if (!required?.when) return false;

        const keys = Object.keys(required.when);

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          const value = this.getText(document, `^${key}${this.data.rules.separator}`);

          keys[i] = required.when[key] === value ? value : "";
        }

        return keys.every(key => key);
      });
  }

  getText(document: TextDocument, pattern: string | RegExp) {
    pattern = RegExp(pattern);

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i);

      if (pattern.test(lineText.text)) return lineText.text.split(this.data.rules.separator)[1];
    }
  }
}
