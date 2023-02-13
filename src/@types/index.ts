export * from "./api";
export * from "./rest";
export * from "./structures";

export interface Constructor<T = any> {
  new(...args: any[]): T
}
