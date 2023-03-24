import { PathLike } from "node:fs";
import { CodeActionKind, CompletionItemKind, DiagnosticSeverity } from "vscode";

export interface ProviderOptions {
  path: PathLike
}

export interface Rules {
  ignore: string
  languageId: string
  messages: { [key: string]: string }
  noSpaces: Base
  noEndSpaces: Base
  scopes: string[]
  separator: string
}

export interface LanguageConfigType extends Base {
  allowSpaces: boolean
  compare: string
  fs: FS
  minValue: WhenClausuleExt
  pattern: string
  properties: string[]
  required: boolean | WhenClausule
  separatorPattern: string
  type: string
  value: number
  values: number[]
}

export interface Base {
  message: string
  codeActionKind: keyof typeof CodeActionKind
  completionItemKind: keyof typeof CompletionItemKind
  severity: keyof typeof DiagnosticSeverity
}

export interface FS extends Base {
  type: string
}

export interface WhenClausule {
  when: LanguageConfigType & { [key: string]: string }
}

export interface WhenClausuleExt extends Base {
  compare: string
  when: { [key: string]: LanguageConfigType }
}

export type LanguageConfig = {
  rules: Rules
} & {
  [key: string]: LanguageConfigType
};
