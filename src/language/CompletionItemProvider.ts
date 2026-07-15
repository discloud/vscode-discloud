import { type JSONSchema7, type JSONSchema7Definition, type JSONSchema7Type } from "json-schema";
import { CompletionItem, CompletionItemKind, FileType, languages, Position, Range, TextEdit, Uri, workspace, type CancellationToken, type CompletionContext, type ExtensionContext, type TextDocument, type TextLine } from "vscode";
import BaseLanguageProvider from "./BaseLanguageProvider";

const assignSymbol = "=";
const arraySeparator = ",";
const arraySeparatorRegexp = /(^,+|,{2,})/;
const comment = "# https://docs.discloud.com/en/discloud.config";
const commentPattern = /\s*#.*$/;
const emptyString = "";
const lineBreakSymbol = "\n";
const pathSeparator = "/";
const pathSeparatorRegexp = /(^[\\/]+|[\\/]{2,})/;

export default class CompletionItemProvider extends BaseLanguageProvider {
  constructor(context: ExtensionContext, schema: JSONSchema7) {
    super(context, schema);

    const disposable = languages.registerCompletionItemProvider({
      language: this.schema.$id,
      pattern: `**/${this.schema.$id}`,
      scheme: "file",
    }, {
      provideCompletionItems: (document, position, token, _context) =>
        Promise.race([
          new Promise<any>((_, reject) => token.onCancellationRequested(reject)),
          this.provideCompletionItems(document, position, token, _context),
        ]).catch(() => []),
    }, lineBreakSymbol, arraySeparator, assignSymbol, pathSeparator);

    this.context.subscriptions.push(disposable);
  }

  async provideCompletionItems(document: TextDocument, position: Position, _token: CancellationToken, _context: CompletionContext) {
    if (!this.schema.properties) return [];

    if (!position.character) {
      return this.scopes
        .map(scope => new CompletionItem(`${scope}${assignSymbol}`, CompletionItemKind.Value))
        .concat(new CompletionItem(comment, CompletionItemKind.Reference));
    }

    const line = document.lineAt(position);
    const text = line.text.replace(commentPattern, emptyString);

    const [key, value] = text.split(assignSymbol);
    const startValueIndex = key.length + 1;

    const textUntilCharacterPosition = text.substring(0, position.character);
    const [_, valueUntilCharacterPosition] = textUntilCharacterPosition.split(assignSymbol);

    const data = this.transformConfigToJSON(document);

    let schema = this.schema;

    const maybeSchema = this.draft.getNode(key, data);

    if (maybeSchema && maybeSchema.node)
      schema = maybeSchema.node.schema;

    const items = await this.parseSchema(schema, {
      document,
      line,
      position,
      text,
      textUntilCharacterPosition,
      key,
      value,
      valueUntilCharacterPosition,
      startValueIndex,
    });

    return items;
  }

  async parseSchema(schema: JSONSchema7, options: ParseSchemaOptions, parentSchema?: JSONSchema7): Promise<CompletionItem[]> {
    switch (schema.type) {
      case "array":
        const items = await this.parseSchemaArray(schema, options);
        if (schema.uniqueItems) {
          return items.filter(item => !options.valueUntilCharacterPosition.includes(item.label.toString()));
        }
        return items;
      case "boolean":
        return this.parseSchemaBoolean(schema, options, parentSchema?.type !== "array");
      case "integer":
      case "number":
        return this.parseSchemaNumber(schema, options, parentSchema?.type !== "array");
      case "null":
        return [];
      case "string":
        return this.parseSchemaString(schema, options, parentSchema?.type !== "array");
      case "object":
      default:
        return this.parseSchemaObject(schema, options);
    }
  }

  async parseSchemaArray(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.enum !== undefined) return this.parseSchemaEnum(schema, options);
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema, options);
    if (schema.items !== undefined) return this.parseSchemaItems(schema, options);
    return [];
  }

  parseSchemaBoolean(_: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    const itemFalse = new CompletionItem("false", CompletionItemKind.Keyword);
    const itemTrue = new CompletionItem("true", CompletionItemKind.Keyword);

    if (replaceValue) {
      const range = new Range(
        new Position(options.position.line, options.startValueIndex),
        new Position(options.position.line, options.line.text.length),
      );
      itemFalse.range = range;
      itemTrue.range = range;
    }

    return [
      itemFalse,
      itemTrue,
    ];
  }

  parseSchemaEnum(schema: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    if (schema.enum !== undefined)
      return schema.enum.flatMap(value => this.parseSchemaType(value, options, replaceValue));
    return [];
  }

  parseSchemaExamples(schema: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    if (schema.examples !== undefined)
      return this.parseSchemaType(schema.examples, options, replaceValue);
    return [];
  }

  async parseSchemaItems(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (Array.isArray(schema.items)) {
      return Promise.all(schema.items.map(value => this.parseSchemaDefinition(value, options, schema))).then(r => r.flat());
    } else {
      return this.parseSchemaDefinition(schema.items!, options, schema);
    }
  }

  parseSchemaType(schema: JSONSchema7Type, options: ParseSchemaOptions, replaceValue?: boolean): CompletionItem[] {
    if (Array.isArray(schema))
      return schema.flatMap(value => this.parseSchemaType(value, options, replaceValue));

    const data: CompletionItem[] = [];

    switch (typeof schema) {
      case "boolean":
      case "number":
      case "string":
        const item = new CompletionItem(`${schema}`);

        if (replaceValue) {
          item.range = new Range(
            new Position(options.position.line, options.startValueIndex),
            new Position(options.position.line, options.text.length),
          );

          data.push(item);
          break;
        }

        const additionalTextEdits: TextEdit[] = [];

        for (const r of getMultipleSeparators(options.value, arraySeparatorRegexp)) {
          additionalTextEdits.push(
            new TextEdit(
              new Range(
                new Position(options.position.line, options.startValueIndex + r.index),
                new Position(options.position.line, options.startValueIndex + r.index + r.length),
              ),
              r.index === 0 ? emptyString : arraySeparator,
            ),
          );
        }

        item.additionalTextEdits = additionalTextEdits;

        const startIndex = options.valueUntilCharacterPosition.lastIndexOf(arraySeparator) + 1;
        const endIndex = Math.max(options.value.indexOf(arraySeparator, startIndex), 0) || options.value.length;

        item.range = new Range(
          new Position(options.position.line, options.startValueIndex + startIndex),
          new Position(options.position.line, options.startValueIndex + endIndex),
        );

        data.push(item);
        break;
    }

    return data;
  }

  parseSchemaNumber(schema: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema, options, replaceValue);
    return [];
  }

  async parseSchemaObject(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.properties !== undefined) {
      return this.parseSchemaProperties(schema, options);
    }

    return [];
  }

  async parseSchemaProperties(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.properties !== undefined) {
      if (schema.properties[options.key])
        return this.parseSchemaDefinition(schema.properties[options.key], options);

      return Promise.all(Object.values(schema.properties)
        .map(property => this.parseSchemaDefinition(property, options)))
        .then(r => r.flat());
    }

    return [];
  }

  async parseSchemaDefinition(schema: JSONSchema7Definition, options: ParseSchemaOptions, parentSchema?: JSONSchema7): Promise<CompletionItem[]> {
    if (typeof schema === "boolean") return [];
    return this.parseSchema(schema, options, parentSchema);
  }

  async parseSchemaString(schema: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    if (schema.enum !== undefined) return this.parseSchemaEnum(schema, options, replaceValue);
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema, options, replaceValue);

    if (typeof schema.format === "string") {
      switch (schema.format) {
        case "uri-reference":
          const startIndex = options.valueUntilCharacterPosition.lastIndexOf(pathSeparator) + 1;
          const endIndex = Math.max(options.value.indexOf(pathSeparator, startIndex), 0) || options.value.length;

          const startPositionIndex = options.startValueIndex + startIndex;
          const endPositionIndex = options.startValueIndex + endIndex;

          const directory = options.valueUntilCharacterPosition.substring(0, startIndex);
          const actual = options.value.substring(startIndex, endIndex);
          const after = options.value.substring(endIndex);

          const rootUri = Uri.joinPath(options.document.uri, "..");
          const targetUri = Uri.joinPath(rootUri, directory);

          const additionalTextEdits: TextEdit[] = [];

          for (const r of getMultipleSeparators(options.value, pathSeparatorRegexp)) {
            additionalTextEdits.push(
              new TextEdit(
                new Range(
                  new Position(options.position.line, options.startValueIndex + r.index),
                  new Position(options.position.line, options.startValueIndex + r.index + r.length),
                ),
                r.index === 0 ? emptyString : pathSeparator,
              ),
            );
          }

          const data: CompletionItem[] = [];

          for (const [filename, fileType] of await safeReadDirectory(targetUri)) {
            const type = fileTypeAsCompletionItemKind[fileType];

            const item = new CompletionItem(filename, type);

            const isDirectory = fileType === FileType.Directory;

            item.additionalTextEdits = additionalTextEdits;

            item.sortText = `${!isDirectory}${filename}`;
            item.insertText = filename;

            const start = new Position(options.position.line, startPositionIndex);

            if (actual === filename) {
              item.range = new Range(
                start,
                new Position(options.position.line, endPositionIndex),
              );

              data.push(item);

              continue;
            }

            const fullValueUri = Uri.joinPath(
              rootUri,
              directory,
              filename,
              after,
            );

            try {
              await workspace.fs.stat(fullValueUri);

              item.range = new Range(
                start,
                new Position(options.position.line, endPositionIndex),
              );
            } catch {
              item.range = new Range(
                start,
                new Position(options.position.line, options.text.length),
              );
            }

            data.push(item);
          }

          return data;
      }
    }

    return [];
  }
}

function* getMultipleSeparators(value: string, sepRegexp: RegExp): Generator<MultiplePathSeparatorsResult, void, void> {
  let baseIndex = 0;
  let mached = sepRegexp.exec(value);
  while (mached !== null) {
    const val = mached[1];
    yield { index: baseIndex + mached.index, length: val.length, value: val };
    baseIndex += val.length;
    value = value.replace(val, emptyString);
    mached = sepRegexp.exec(value);
  }
}

async function safeReadDirectory(uri: Uri) {
  try { return await workspace.fs.readDirectory(uri); }
  catch { return []; }
}

const fileTypeAsCompletionItemKind: Record<FileType, CompletionItemKind> = {
  [FileType.Directory]: CompletionItemKind.Folder,
  [FileType.File]: CompletionItemKind.File,
  [FileType.SymbolicLink]: CompletionItemKind.Keyword,
  [FileType.Unknown]: CompletionItemKind.Keyword,
};

interface ParseSchemaOptions {
  readonly document: TextDocument
  readonly line: TextLine
  readonly position: Position
  readonly text: string
  readonly textUntilCharacterPosition: string,
  readonly key: string
  readonly value: string
  readonly valueUntilCharacterPosition: string
  readonly startValueIndex: number
}

interface MultiplePathSeparatorsResult {
  readonly index: number
  readonly length: number
  readonly value: string
}
