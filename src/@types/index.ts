export * from "./api";
export * from "./providers";
export * from "./rest";
export * from "./structures";

export interface Constructor<T = any> {
  new(...args: any[]): T
}
