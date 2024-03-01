import { t } from "@vscode/l10n";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, Disposable, Position, Range, TextDocument, languages, window, workspace } from "vscode";
import { ProviderOptions } from "../@types";
import extension from "../extension";
import BaseLanguageProvider from "./BaseLanguageProvider";

export default class LanguageConfigurationProvider extends BaseLanguageProvider {
  readonly disposableDocuments: Disposable[] = [];
  declare readonly collection: DiagnosticCollection;

  constructor(public options: ProviderOptions) {
    super(options.path.toString());

    if (!this.schema) return;

    this.collection = languages.createDiagnosticCollection(this.schema.$id);

    const disposableEditor = window.onDidChangeActiveTextEditor(editor => {
      if (editor?.document.languageId === this.schema.$id!) {
        this.checkDocument(editor.document);
        this.activate();
      } else {
        this.deactivate();
        this.collection.clear();
      }
    });

    const disposableOpen = workspace.onDidOpenTextDocument(document => {
      if (document.languageId === this.schema.$id) {
        this.checkDocument(document);
      }
    });

    if (window.activeTextEditor?.document.languageId === this.schema.$id!) {
      this.checkDocument(window.activeTextEditor.document);
      this.activate();
    }

    extension.subscriptions.push(this.collection, disposableEditor, disposableOpen);
  }

  activate() {
    const disposable = workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === this.schema.$id) {
        for (const _ of event.contentChanges) {
          this.checkDocument(event.document);
        }
      }
    });

    this.disposableDocuments.push(disposable);
    extension.subscriptions.push(disposable);
  }

  deactivate() {
    for (const disposable of this.disposableDocuments.splice(0)) {
      disposable.dispose();
    }
  }

  checkDocument(document: TextDocument) {
    if (document.languageId !== this.schema.$id) return;

    const diagnostics = <Diagnostic[]>[];

    const workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (workspaceFolder) {
      if (workspaceFolder !== dirname(document.uri.fsPath)) {
        window.showErrorMessage(t("diagnostic.wrong.file.location"));

        diagnostics.push({
          message: t("diagnostic.wrong.file.location"),
          range: new Range(
            new Position(0, 0),
            new Position(0, 0),
          ),
          severity: DiagnosticSeverity.Error,
        });
      }
    }

    const config = this.transformConfigToJSON(document);

    const errors = this.validateJsonSchema(config);

    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];

      switch (error.code) {
        case "required-property-error":
          errors.splice(i, 1);
          diagnostics.push({
            message: error.message,
            range: new Range(
              new Position(0, 0),
              new Position(0, 0)
            ),
            severity: DiagnosticSeverity.Error,
          });
          break;
      }
    }

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);

      if (!line.text) continue;

      const workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath;

      const keyAndValue = line.text.split("=");
      const [key, value] = keyAndValue;

      const scopeSchema = this.schema.properties?.[key];

      if (!scopeSchema || typeof scopeSchema === "boolean") continue;

      const errorIndex = errors.findIndex(e => e.data.pointer.includes(key));

      if (errorIndex > -1) {
        const error = errors.splice(errorIndex, 1)[0];

        diagnostics.push({
          range: new Range(
            new Position(i, key.length + 1),
            new Position(i, line.text.length),
          ),
          message: error.message.replace("#/", ""),
          severity: DiagnosticSeverity.Error,
        });
      }

      switch (scopeSchema.type) {
        case "string":
          if (scopeSchema.format) {
            switch (scopeSchema.format) {
              case "uri-reference":
                if (workspaceFolder) {
                  if (!existsSync(join(workspaceFolder, value))) {
                    diagnostics.push({
                      message: t("diagnostic.main.not.exist"),
                      range: new Range(
                        new Position(i, key.length + 1),
                        new Position(i, line.text.length)
                      ),
                      severity: DiagnosticSeverity.Error,
                    });
                  }
                }
                break;
            }
          }
          break;
      }
    }

    this.collection.set(document.uri, diagnostics);
  }
}
