import { t } from "@vscode/l10n";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { type Diagnostic, type DiagnosticCollection, DiagnosticSeverity, type ExtensionContext, Position, Range, type TextDocument, languages, window, workspace } from "vscode";
import { type ProviderOptions } from "../@types";
import BaseLanguageProvider from "./BaseLanguageProvider";

export default class LanguageConfigurationProvider extends BaseLanguageProvider {
  declare readonly collection: DiagnosticCollection;

  constructor(context: ExtensionContext, options: ProviderOptions) {
    super(context, options.path.toString());

    if (!this.schema) return;

    this.collection = languages.createDiagnosticCollection(this.schema.$id);

    const disposableOpen = workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === this.schema.$id) {
        this.checkDocument(document);
      }
    });

    const disposableClose = workspace.onDidCloseTextDocument((document) => {
      if (document.languageId === this.schema.$id) {
        this.collection.delete(document.uri);
      }
    });

    queueMicrotask(() => {
      this.activate();

      for (let i = 0; i < workspace.textDocuments.length; i++) {
        const document = workspace.textDocuments[i];
        if (document.languageId === this.schema.$id!) {
          this.checkDocument(document);
        }
      }
    });

    context.subscriptions.push(this.collection, disposableClose, disposableOpen);
  }

  activate() {
    const disposable = workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === this.schema.$id) {
        for (const _ of event.contentChanges) {
          this.checkDocument(event.document);
        }
      }
    });

    this.context.subscriptions.push(disposable);
  }

  checkDocument(document: TextDocument) {
    if (document.languageId !== this.schema.$id) return;

    const diagnostics: Diagnostic[] = [];

    const workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri;

    if (workspaceFolder) {
      if (workspaceFolder.fsPath !== dirname(document.uri.fsPath)) {
        // @ts-expect-error ts(2339)
        if (!document.uri._discloudDiscloudHasWrongLocationWarned) {
          // @ts-expect-error ts(2339)
          document.uri._discloudDiscloudHasWrongLocationWarned = true;
          window.showErrorMessage(t("diagnostic.wrong.file.location"));
        }

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

    const data = this.transformConfigToJSON(document);

    const errors = this.validateJsonSchema(data);

    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];

      switch (error.code) {
        case "required-property-error":
          errors.splice(i, 1);

          diagnostics.push({
            message: error.message.substring(0, error.message.lastIndexOf(` at \`${error.data.pointer}\``)),
            range: new Range(
              new Position(0, 0),
              new Position(0, 0),
            ),
            severity: DiagnosticSeverity.Error,
          });
          break;
      }
    }

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);

      const lineText = line.text.replace(/\s*#.*/, "");

      if (!lineText) continue;

      const keyAndValue = lineText.split("=");
      const [key, value] = keyAndValue;

      const scopeSchema = this.draft.getSchema({ data, pointer: key });

      if (!scopeSchema || scopeSchema.type === "error") continue;

      const errorIndex = errors.findIndex(e => e.data.pointer.includes(key));

      if (errorIndex > -1) {
        const error = errors.splice(errorIndex, 1)[0];

        diagnostics.push({
          message: error.message.replace("#/", ""),
          range: new Range(
            new Position(i, key.length + 1),
            new Position(i, lineText.length),
          ),
          severity: DiagnosticSeverity.Error,
        });
      }

      switch (scopeSchema.type) {
        case "string":
          if (scopeSchema.format) {
            switch (scopeSchema.format) {
              case "uri-reference":
                if (!existsSync(join(dirname(document.uri.fsPath), value))) {
                  diagnostics.push({
                    message: t("diagnostic.main.not.exist"),
                    range: new Range(
                      new Position(i, key.length + 1),
                      new Position(i, lineText.length),
                    ),
                    severity: DiagnosticSeverity.Error,
                  });
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
