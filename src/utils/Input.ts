import { t } from "@vscode/l10n";
import { type InputBoxOptions, window } from "vscode";
import { clamp } from "./utils";

export default class InputBox {
  static getExternalURL(options?: ExternalURLInputOptions): Promise<string | void>
  static getExternalURL<Required extends true>(options: ExternalURLInputOptions<Required>): Promise<string>
  static getExternalURL<Required extends boolean>(options?: ExternalURLInputOptions<Required>): Promise<string | void>
  static async getExternalURL(options?: ExternalURLInputOptions) {
    options ??= {};

    const url = await window.showInputBox({
      prompt: options.prompt,
      async validateInput(value) {
        if (!URL.canParse(value)) return options.prompt;

        let response;
        try {
          response = await fetch(value);
        } catch {
          return options.prompt;
        }

        if (!response.ok) return options.prompt;

        if (typeof options.validate === "function")
          return options.validate(response);
      },
    });

    if (url) return encodeURI(url);

    if (options.required) throw Error(t("missing.input"));
  }

  static getExternalImageURL(options?: ExternalImageURLInputOptions): Promise<string | void>
  static getExternalImageURL<Required extends true>(options: ExternalImageURLInputOptions<Required>): Promise<string>
  static getExternalImageURL<Required extends boolean>(options?: ExternalImageURLInputOptions<Required>): Promise<string | void>
  static async getExternalImageURL(options?: ExternalImageURLInputOptions) {
    options ??= {};

    return await InputBox.getExternalURL({
      prompt: options.prompt,
      required: options.required,
      validate(response) {
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("image/")) return options.prompt;
      },
    });
  }

  static getInt(options?: IntInputOptions): Promise<number | void>
  static getInt<Required extends true>(options: IntInputOptions<Required>): Promise<number>
  static getInt<Required extends boolean>(options?: IntInputOptions<Required>): Promise<number | void>
  static async getInt(options?: IntInputOptions) {
    options ??= {};

    if (options.min !== undefined && isNaN(options.min)) throw Error("Invalid option min");
    if (options.min !== undefined && isNaN(options.min)) throw Error("Invalid option max");
    if (options.initial !== undefined && isNaN(options.initial)) throw Error("Invalid option initial");

    const min = options.min !== undefined ? Number(options.min) : undefined;
    const max = options.max !== undefined ? Number(options.max) : undefined;
    const _initial = options.initial !== undefined ? Number(options.initial) : 0;
    const initial = clamp(_initial, min ?? _initial, max ?? _initial);
    const denyInitial = options.denyInitial;

    const title = [
      ...min !== undefined ? [min] : [],
      ...max !== undefined ? [max] : [],
    ].join(" • ");


    let result: string | number | void = await window.showInputBox({
      prompt: options.prompt,
      title,
      value: initial.toString(),
      validateInput(value) {
        const input = parseInt(value);

        if (isNaN(input)) return options.prompt ?? "Invalid NaN value";
        if (denyInitial && input === initial) return options.prompt ?? "Invalid initial value";
        if (typeof min === "number" && input < min) return options.prompt ?? `Less than the minimum of ${min}`;
        if (typeof max === "number" && input > max) return options.prompt ?? `Greater than maximum of ${max}`;
      },
    });

    if (options.required && !result) throw Error(t("missing.input"));

    if (typeof result === "string") result = parseInt(result);

    return result;
  }
}

type ValidateInput = NonNullable<InputBoxOptions["validateInput"]>

interface ExternalURLInputOptions<Required extends boolean = false> {
  prompt?: string
  required?: Required
  validate?: (response: Response) => ReturnType<ValidateInput>
}

interface ExternalImageURLInputOptions<Required extends boolean = false> {
  prompt?: string
  required?: Required
}

interface IntInputOptions<Required extends boolean = false> {
  initial?: number
  min?: number
  max?: number
  /** @default false */
  denyInitial?: boolean
  required?: Required
  prompt?: string
}
