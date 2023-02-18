import { t } from "@vscode/l10n";
import { APTPackages } from "discloud.app";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Diagnostic, DiagnosticSeverity, Disposable, languages, Position, Range, TextDocument, window, workspace } from "vscode";
import extension from "../extension";
import { DiscloudConfigScopes, requiredScopes } from "../util";

export default class DiagnosticProvider {
  collection = languages.createDiagnosticCollection("discloud.config");
  diagnostics: Diagnostic[] = [];
  disposableDocuments: Disposable[] = [];

  constructor() {
    if (window.activeTextEditor?.document.languageId === "discloud.config") {
      this.check(window.activeTextEditor.document);
      this.activate();
    }

    const disposableEditor = window.onDidChangeActiveTextEditor(editor => {
      if (editor?.document.languageId === "discloud.config") {
        this.check(editor.document);
        this.activate();
      } else {
        this.deactivate();
        this.collection.clear();
      }
    });

    extension.context.subscriptions.push(disposableEditor);
  }

  activate() {
    const disposable = workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === "discloud.config")
        for (const _ of event.contentChanges) {
          this.check(event.document);
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

  check(document: TextDocument) {
    this.diagnostics = [];

    const scopes: Record<string, any> = {};
    let type: "bot" | "site" | "common" | undefined;

    for (let i = 0; i < document.lineCount; i++) {
      const textLine = document.lineAt(i);
      if (!textLine.text) continue;
      if (textLine.text.startsWith("#")) continue;
      const [key, value] = textLine.text.split("=");

      scopes[key] = value;

      if (/\s/g.test(key))
        this.diagnostics.push({
          message: t("diagnostic.no.spaces"),
          range: new Range(
            new Position(i, 0),
            new Position(i, key.length)
          ),
          severity: DiagnosticSeverity.Error,
        });      

      if (DiscloudConfigScopes.includes(key)) {
        if (!textLine.text.includes("="))
          this.diagnostics.push({
            message: t("diagnostic.equal.missing"),
            range: new Range(
              new Position(i, key.length),
              new Position(i, textLine.text.length)
            ),
            severity: DiagnosticSeverity.Error,
          });

        if (/(^\s|\s$)/.test(value))
          this.diagnostics.push({
            message: t("diagnostic.no.spaces"),
            range: new Range(
              new Position(i, key.length + 1),
              new Position(i, textLine.text.length)
            ),
            severity: DiagnosticSeverity.Error,
          });

        if (key === "TYPE") {
          type = DiagnosticProvider.TYPE({
            diagnostics: this.diagnostics,
            document,
            line: i,
            text: value,
            end: textLine.text.length,
            start: key.length + 1,
          });
        } else {
          DiagnosticProvider[<"MAIN">key]?.({
            diagnostics: this.diagnostics,
            document,
            line: i,
            text: value,
            end: textLine.text.length,
            start: key.length + 1,
          });
        }
      } else {
        this.diagnostics.push({
          message: t("diagnostic.wrong"),
          range: new Range(
            new Position(i, 0),
            new Position(i, key.length)
          ),
          severity: DiagnosticSeverity.Error,
        });
      }
    }

    const missingScopes = requiredScopes[type ?? "common"]
      .filter((scope) => !scopes[scope]);

    if (missingScopes.length) {
      this.diagnostics.push({
        message: t("diagnostic.scopes.missing", {
          scopes: `[${missingScopes.join(", ")}]`,
        }),
        range: new Range(
          new Position(0, 0),
          new Position(document.lineCount, 0)
        ),
        severity: DiagnosticSeverity.Error,
      });
    }

    this.updateDiagnostics(document);
  }

  updateDiagnostics(document: TextDocument) {
    this.collection.set(document.uri, this.diagnostics);
  }

  static APT(data: DiagnosticData) {
    if (!data.text) return;
    let aptslength = 0;
    const apts = data.text.split(/,\s?/g);

    for (const apt of apts) {
      if (!APTPackages.includes(<"tools">apt))
        data.diagnostics.push({
          message: t("diagnostic.apt.invalid"),
          range: new Range(
            new Position(data.line, aptslength + (data.start ?? 0)),
            new Position(data.line, aptslength + (data.end ?? data.start ?? 0))
          ),
          severity: DiagnosticSeverity.Error,
        });

      aptslength += apt.length + 1;
    }
  }

  static AUTORESTART(data: DiagnosticData) {
    if (!data.text) return;
    if (!["true", "false"].includes(data.text))
      data.diagnostics.push({
        message: t("diagnostic.must.be.boolean"),
        range: new Range(
          new Position(data.line, data.start ?? 0),
          new Position(data.line, data.end ?? data.start ?? 0)
        ),
        severity: DiagnosticSeverity.Error,
      });
  }

  static AVATAR(data: DiagnosticData) {
    if (!data.text) return;
    if (!/(https?:\/\/).+\.(png)/.test(data.text)) {
      data.diagnostics.push({
        message: t("diagnostic.avatar.must.be.url"),
        range: new Range(
          new Position(data.line, data.start ?? 0),
          new Position(data.line, data.end ?? data.start ?? 0)
        ),
        severity: DiagnosticSeverity.Error,
      });
    }
  }

  static MAIN(data: DiagnosticData) {
    if (!data.text) return;
    if (!extension.workspaceFolder) return;
    if (!existsSync(join(extension.workspaceFolder, data.text)))
      data.diagnostics.push({
        message: t("diagnostic.main.not.exist"),
        range: new Range(
          new Position(data.line, data.start ?? 0),
          new Position(data.line, data.end ?? data.start ?? 0)
        ),
        severity: DiagnosticSeverity.Error,
      });
  }

  static RAM(data: DiagnosticData) {
    if (!data.text) return;
    if (isNaN(Number(data.text))) {
      data.diagnostics.push({
        message: t("diagnostic.ram.must.be.number"),
        range: new Range(
          new Position(data.line, data.start ?? 0),
          new Position(data.line, data.end ?? data.start ?? 0)
        ),
        severity: DiagnosticSeverity.Error,
      });
    } else {
      const type = this.getText(data.document, /^TYPE=/);
      const min = type === "site" ? 512 : 100;

      if (Number(data.text) < min)
        data.diagnostics.push({
          message: t("diagnostic.ram.must.be.higher", {
            min,
          }),
          range: new Range(
            new Position(data.line, data.start ?? 0),
            new Position(data.line, data.end ?? data.start ?? 0)
          ),
          severity: DiagnosticSeverity.Error,
        });
    }
  }

  static TYPE(data: DiagnosticData) {
    if (data.text === "bot") return "bot";
    if (data.text === "site") return "site";
    data.diagnostics.push({
      message: t("diagnostic.type.must.be"),
      range: new Range(
        new Position(data.line, data.start ?? 0),
        new Position(data.line, data.end ?? data.start ?? 0)
      ),
      severity: DiagnosticSeverity.Error,
    });
    return "common";
  }

  static VERSION(data: DiagnosticData) {
    if (!data.text) return;

    if (!/^(latest|current|suja|(?:\d+\.[\dx]+\.[\dx]+))$/.test(data.text))
      data.diagnostics.push({
        message: t("diagnostic.version.invalid"),
        range: new Range(
          new Position(data.line, data.start ?? 0),
          new Position(data.line, data.end ?? data.start ?? 0)
        ),
        severity: DiagnosticSeverity.Error,
      });
  }

  static getText(document: TextDocument, pattern: string | RegExp) {
    pattern = RegExp(pattern);
    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i);
      if (pattern.test(lineText.text)) return lineText.text.split("=")[1];
    }
  }
}

interface DiagnosticData {
  diagnostics: Diagnostic[]
  document: TextDocument
  text: string
  line: number
  start?: number
  end?: number
}
