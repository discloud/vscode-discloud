import { t } from "@vscode/l10n";
import type { JSONSchema7 } from "json-schema";
import type { AnnotationData, JsonError } from "json-schema-library";
import { type Diagnostic, type DiagnosticCollection, DiagnosticSeverity, type ExtensionContext, Position, Range, type TextDocument, Uri, languages, window, workspace } from "vscode";
import lazy from "../utils/lazy";
import BaseLanguageProvider from "./BaseLanguageProvider";

const _assignSymbol = "=";
const _commentPattern = /\s*#.*$/;
const _emptyString = "";
const _negativeOne = -1;
const _parentSegment = "..";

const _lazyRange0000 = lazy(() => new Range(new Position(0, 0), new Position(0, 0)));

export default class LanguageConfigurationProvider extends BaseLanguageProvider {
  constructor(context: ExtensionContext, schema: JSONSchema7) {
    super(context, schema);

    this.collection = languages.createDiagnosticCollection(this.schema.$id);
    context.subscriptions.push(this.collection);

    workspace.onDidChangeTextDocument((event) =>
      this.#checkDocument(event.document), null, context.subscriptions);

    workspace.onDidCloseTextDocument((document) =>
      this.collection.delete(document.uri), null, context.subscriptions);

    workspace.onDidOpenTextDocument((document) =>
      this.#checkDocument(document), null, context.subscriptions);

    queueMicrotask(() => {
      for (let i = 0; i < workspace.textDocuments.length; i++) {
        const document = workspace.textDocuments[i];
        this.#checkDocument(document);
      }
    });
  }

  declare protected readonly collection: DiagnosticCollection;

  async #checkDocument(document: TextDocument) {
    if (document.languageId !== this.schema.$id) return;

    const diagnostics: Diagnostic[] = [];

    const rootUri = Uri.joinPath(document.uri, _parentSegment);

    this.#checkDocumentLocation(document, rootUri, diagnostics);

    const data = this.transformConfigToJSON(document);

    const result = this.validateJsonSchema(data);

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);

      const lineText = line.text.replace(_commentPattern, _emptyString);
      if (!lineText) continue;

      const keyAndValue = lineText.split(_assignSymbol);
      const [key, value] = keyAndValue;

      if (typeof value !== "string") continue;

      const scopeSchema = this.draft.getNode(key, data);

      if (!scopeSchema || scopeSchema.error) continue;

      const errorIndex = result.errors.findIndex(e => e.data.key === key || e.data.pointer.endsWith(key));

      if (errorIndex !== _negativeOne) {
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
        range: _lazyRange0000(),
        severity: DiagnosticSeverity.Error,
        code: `${error.code}`,
      });
    }

    this.collection.set(document.uri, diagnostics);
  }

  #checkDocumentLocation(document: TextDocument, rootUri: Uri, diagnostics: Diagnostic[]) {
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri);

    if (!workspaceFolder || workspaceFolder.uri.fsPath === rootUri.fsPath) return;

    // @ts-expect-error ts(2339)
    if (!document.uri._discloudDiscloudHasWrongLocationWarned) {
      // @ts-expect-error ts(2339)
      document.uri._discloudDiscloudHasWrongLocationWarned = true;
      void window.showErrorMessage(t("diagnostic.wrong.file.location"));
    }

    diagnostics.push({
      message: t("diagnostic.wrong.file.location"),
      range: _lazyRange0000(),
      severity: DiagnosticSeverity.Error,
    });
  }
}

function formatErrorMessage(error: JsonError<AnnotationData<Record<string, unknown>>>) {
  if (error.data.pointer === "#") return error.message.replace("at `#`", "");
  if (error.data.pointer.startsWith("#/")) return error.message.replace("#/", "");
  return error.message;
}
