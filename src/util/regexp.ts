import { FILE_EXT } from "./constants";

export const FILE_EXT_REGEXP = RegExp(`${FILE_EXT.replace(/(\.)/, "\\$1")}$`, "i");
