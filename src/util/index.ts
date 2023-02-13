export * from "./API";
export * from "./constants";
export * from "./GS";
export * from "./utils";
export * from "./Zip";

export function normalizePathlike(path = "**") {
  return path.replace(/\\/g, "/").replace(/^(\.|~)$|^(\.|~)\/|^\/|\/$/g, "");
}
