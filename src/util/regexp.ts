import { NODE_MODULES_EXTENSIONS } from "./constants";

export const NODE_MODULES_EXTENSIONS_REGEXP =
  RegExp(`(${Array.from(NODE_MODULES_EXTENSIONS).join("|").replace(/(\.)/g, "\\$1")})$`, "i");

export const IMAGE_URL_REGEXP = /^((?:s?ftp|https?):\/\/\S+\.(?:gif|jpe?g|png))(?:[?]\S*)?$/;
