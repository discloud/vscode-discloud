import crypto from "crypto";

const hashAlgorithm = "md5";

export function hash(data: crypto.BinaryLike) {
  return crypto.hash(hashAlgorithm, data);
}
