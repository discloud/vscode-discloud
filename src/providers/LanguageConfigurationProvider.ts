import { t } from "@vscode/l10n";
import { existsSync } from "fs";
import { type JSONSchema7 } from "json-schema";
import { dirname, join } from "path";
import { type Diagnostic, type DiagnosticCollection, DiagnosticSeverity, type ExtensionContext, Position, Range, type TextDocument, languages, window, workspace } from "vscode";
import BaseLanguageProvider from "./BaseLanguageProvider";

export default class LanguageConfigurationProvider extends BaseLanguageProvider {
  declare readonly collection: DiagnosticCollection;

  constructor(context: ExtensionContext, schema: JSONSchema7) {
    super(context, schema);

    this.collection = languages.createDiagnosticCollection(this.schema.$id);

    const disposableOpen = workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === this.schema.$id) {
        this.checkDocument(document);
      }
    });

    const disposableClose = workspace.onDidCloseTextDocument((document) => {
      if (this.collection.has(document.uri)) {
        this.collection.delete(document.uri);
      }
    });

    queueMicrotask(() => {
      this.activate();

      for (let i = 0; i < workspace.textDocuments.length; i++) {
        const document = workspace.textDocuments[i];
        if (document.languageId === this.schema.$id) {
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

  async checkDocument(document: TextDocument) {
    if (document.languageId !== this.schema.$id) return;

    const diagnostics: Diagnostic[] = [];

    const workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri;

    if (workspaceFolder) {
      if (workspaceFolder.fsPath !== dirname(document.uri.fsPath)) {
        // @ts-expect-error ts(2339)
        if (!document.uri._discloudDiscloudHasWrongLocationWarned) {
          // @ts-expect-error ts(2339)
          document.uri._discloudDiscloudHasWrongLocationWarned = true;
          await window.showErrorMessage(t("diagnostic.wrong.file.location"));
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

    const result = this.validateJsonSchema(data);

    for (let i = 0; i < result.errors.length; i++) {
      const error = result.errors[i];

      switch (error.code) {
        case "required-property-error":
          result.errors.splice(i, 1);

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

      const scopeSchema = this.draft.getNode(key, data);

      if (!scopeSchema || scopeSchema.error) continue;

      const errorIndex = result.errors.findIndex(e => e.data.pointer.includes(key));

      if (errorIndex > -1) {
        const error = result.errors.splice(errorIndex, 1)[0];

        diagnostics.push({
          message: error.message.replace("#/", ""),
          range: new Range(
            new Position(i, key.length + 1),
            new Position(i, lineText.length),
          ),
          severity: DiagnosticSeverity.Error,
        });
      }

      if (!scopeSchema.node) continue;

      switch (scopeSchema.node.schema.type) {
        case "string":
          if (scopeSchema.node.schema.format) {
            switch (scopeSchema.node.schema.format) {
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
