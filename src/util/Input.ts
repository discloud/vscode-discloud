import { window } from "vscode";
import { clamp } from "./utils";

export class InputBox {
  static async getInt(options?: IntInputOptions) {
    options ??= {};

    if (options.min !== undefined && isNaN(options.min)) throw Error("Invalid option min");
    if (options.min !== undefined && isNaN(options.min)) throw Error("Invalid option max");
    if (options.initial !== undefined && isNaN(options.initial)) throw Error("Invalid option initial");

    const min = options.min !== undefined ? Number(options.min) : undefined;
    const max = options.max !== undefined ? Number(options.max) : undefined;
    const _initial = options.initial !== undefined ? Number(options.max) : 0;
    const initial = clamp(_initial, min ?? _initial, max ?? _initial);
    const denyInitial = options.denyInitial;

    const title = [
      ...min !== undefined ? [min] : [],
      ...max !== undefined ? [max] : [],
    ].join(" • ");

    function validateInput(input: number) {
      if (isNaN(input)) return false;
      if (denyInitial && input === initial) return false;
      if (typeof min === "number" && input < min) return false;
      if (typeof max === "number" && input > max) return false;
      return true;
    }

    let result;
    do {
      result = await window.showInputBox({
        value: initial.toString(),
        title,
        prompt: options.prompt,
        validateInput(value) {
          const input = parseInt(value);

          if (isNaN(input)) return options.prompt ?? "Invalid NaN value";
          if (denyInitial && input === initial) return options.prompt ?? "Invalid initial value";
          if (typeof min === "number" && input < min) return options.prompt ?? "Less than the minimum";
          if (typeof max === "number" && input > max) return options.prompt ?? "Greater than maximum";
        },
      });
      if (typeof result === "string") result = parseInt(result);
    } while (typeof result === "number" ? !validateInput(result) : false);

    return result;
  }
}

interface IntInputOptions {
  initial?: number
  min?: number
  max?: number
  /** @default false */
  denyInitial?: boolean
  prompt?: string
}
