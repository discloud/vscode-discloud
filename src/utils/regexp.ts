export const IMAGE_URL_REGEXP = /^(https?:\/\/\S+\.(?:gif|jpe?g|png|webp))(?:[?#]\S*)?$/;

const scapeRegExpPattern = /([\\|^$.*+?()[\]{}])/g;

export function scapeRegExp(input: string) {
  return input.replace(scapeRegExpPattern, "\\$1");
}
