import { t } from "@vscode/l10n";
import type { JSONSchema7 } from "json-schema";
import type { AnnotationData, JsonError } from "json-schema-library";
import { type Diagnostic, type DiagnosticCollection, DiagnosticSeverity, type ExtensionContext, Position, Range, type TextDocument, Uri, languages, window, workspace } from "vscode";
import BaseLanguageProvider from "./BaseLanguageProvider";

const assignSymbol = "=";
const commentPattern = /\s*#.*$/;

export default class LanguageConfigurationProvider extends BaseLanguageProvider {
  declare readonly collection: DiagnosticCollection;

  constructor(context: ExtensionContext, schema: JSONSchema7) {
    super(context, schema);

    this.collection = languages.createDiagnosticCollection(this.schema.$id);

    const disposableChange = workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === this.schema.$id) {
        this.checkDocument(event.document);
      }
    });

    const disposableClose = workspace.onDidCloseTextDocument((document) => this.collection.delete(document.uri));

    const disposableOpen = workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === this.schema.$id) {
        this.checkDocument(document);
      }
    });

    context.subscriptions.push(this.collection, disposableChange, disposableClose, disposableOpen);

    queueMicrotask(() => {
      for (let i = 0; i < workspace.textDocuments.length; i++) {
        const document = workspace.textDocuments[i];
        this.checkDocument(document);
      }
    });
  }

  async checkDocument(document: TextDocument) {
    if (document.languageId !== this.schema.$id) return;

    const diagnostics: Diagnostic[] = [];

    const workspaceFolder = workspace.getWorkspaceFolder(document.uri);

    const rootUri = Uri.joinPath(document.uri, "..");

    if (workspaceFolder) {
      if (workspaceFolder.uri.fsPath !== rootUri.fsPath) {
        // @ts-expect-error ts(2339)
        if (!document.uri._discloudDiscloudHasWrongLocationWarned) {
          // @ts-expect-error ts(2339)
          document.uri._discloudDiscloudHasWrongLocationWarned = true;
          void window.showErrorMessage(t("diagnostic.wrong.file.location"));
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

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);

      const lineText = line.text.replace(commentPattern, "");

      if (!lineText) continue;

      const keyAndValue = lineText.split(assignSymbol);
      const [key, value] = keyAndValue;

      if (typeof value !== "string") continue;

      const scopeSchema = this.draft.getNode(key, data);

      if (!scopeSchema || scopeSchema.error) continue;

      const errorIndex = result.errors.findIndex(e => e.data.key === key || e.data.pointer.endsWith(key));

      if (errorIndex > -1) {
        const error = result.errors.splice(errorIndex, 1)[0];

        diagnostics.push({
          message: formatErrorMessage(error),
          range: new Range(
            new Position(i, key.length + 1),
            new Position(i, lineText.length),
          ),
          severity: DiagnosticSeverity.Error,
          code: `${error.code}`,
        });
      }

      if (!scopeSchema.node) continue;

      switch (scopeSchema.node.schema.type) {
        case "string":
          if (scopeSchema.node.schema.format) {
            switch (scopeSchema.node.schema.format) {
              case "uri-reference":
                try {
                  await workspace.fs.stat(Uri.joinPath(rootUri, value));
                } catch (error: any) {
                  diagnostics.push({
                    message: t("diagnostic.main.not.exist"),
                    range: new Range(
                      new Position(i, key.length + 1),
                      new Position(i, lineText.length),
                    ),
                    severity: DiagnosticSeverity.Error,
                    code: error.code,
                  });
                }
                break;
            }
          }
          break;
      }
    }

    for (let i = 0; i < result.errors.length; i++) {
      const error = result.errors[i];

      diagnostics.push({
        message: formatErrorMessage(error),
        range: new Range(new Position(0, 0), new Position(0, 0)),
        severity: DiagnosticSeverity.Error,
        code: `${error.code}`,
      });
    }

    this.collection.set(document.uri, diagnostics);
  }
}

function formatErrorMessage(error: JsonError<AnnotationData<Record<string, unknown>>>) {
  if (error.data.pointer === "#") return error.message.replace("at `#`", "");
  if (error.data.pointer.startsWith("#/")) return error.message.replace("#/", "");
  return error.message;
}
