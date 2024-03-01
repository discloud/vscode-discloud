import type { BinaryLike } from "crypto";
import { createReadStream, existsSync, type PathLike } from "fs";
import { Stream, type Readable, type Writable } from "stream";
import { fetch, File } from "undici";

export const fileNamePattern = /.*\/+([^?#]+)(?:[?#].*)?/;

export interface RawFile {
  /**
   * The name of the file
   */
  name: string
  /**
   * An explicit key to use for key of the formdata field for this file.
   */
  key?: string
  /**
   * The actual data for the file
   */
  data: Blob | BinaryLike | Buffer | DataView | File
  /**
   * Content-Type of the file
   */
  contentType?: string
}

/**
 * This parameter could be {@link Blob}, {@link Buffer}, {@link File}, {@link PathLike}, {@link RawFile}, {@link Readable}, {@link String}, {@link URL} or {@link Writable} 
 */
export type FileResolvable =
  | Blob
  | File
  | PathLike
  | RawFile
  | Readable
  | Writable;

/**
 * A function that converts {@link FileResolvable} to {@link File}
 * 
 * @param file - The file as {@link FileResolvable} to resolve
 * @param fileName - The name of the file to upload
 */
export async function resolveFile(file: FileResolvable, fileName?: string): Promise<File> {
  if (file instanceof File) return file;

  if (file instanceof URL || typeof file === "string") {
    file = file.toString();

    fileName ??= file.match(fileNamePattern)?.pop();

    if (/^(?:s?ftp|https?):\/\//.test(file)) {
      const response = await fetch(file);

      if (response.status > 399) throw response;

      return response.blob()
        .then(blob => new File([blob], fileName ?? `file.${resolveBlobType(blob)}`, { type: blob.type }));
    }

    if (existsSync(file))
      return streamToFile(createReadStream(file), fileName ?? "file.zip");

    return new File([file], fileName ?? "file.zip");
  }

  if (file instanceof Blob) return new File([file], fileName ?? `file.${resolveBlobType(file)}`, { type: file.type });

  fileName ??= "file.zip";

  if (Buffer.isBuffer(file)) return new File([file], fileName);

  if ("data" in file) {
    if (file.data instanceof File) return file.data;

    return new File([file.data], file.name, { type: file.contentType });
  }

  if (!Stream.isErrored(file)) return streamToFile(file, fileName);

  throw new TypeError("Invalid file type was provided.");
}

export type FileResolvableSync = Exclude<FileResolvable, URL | Readable | Writable>;

export function resolveFileSync(file: FileResolvableSync, fileName?: string): File {
  if (file instanceof File) return file;

  fileName ??= "file.zip";

  if (typeof file === "string") {
    return new File([file], fileName);
  }

  if (file instanceof Blob) return new File([file], fileName);

  if (Buffer.isBuffer(file)) return new File([file], fileName);

  if ("data" in file) {
    if (file.data instanceof File) return file.data;

    return new File([file.data], file.name);
  }

  throw new TypeError("Invalid file type was provided.");
}

/**
 * A function that converts a like {@link Stream} parameter to {@link File}
 * 
 * @param stream - A parameter like {@link Readable} or {@link Writable}
 * @param fileName - A file name, if you wish
 * @param mimeType - A mimeType parameter
 */
export function streamToFile(stream: Stream, fileName?: string | null, mimeType?: string) {
  return new Promise<File>((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", chunk => chunks.push(chunk))
      .once("end", () => resolve(new File(chunks, fileName ?? "file.zip", { type: mimeType })))
      .once("error", reject);
  });
}

/**
 * A function that converts a like {@link Stream} parameter to {@link Blob}
 * 
 * @param stream - A parameter like {@link Readable} or {@link Writable}
 * @param mimeType - A mimeType parameter
 */
export function streamToBlob(stream: Stream, mimeType?: string) {
  return new Promise<Blob>((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", chunk => chunks.push(chunk))
      .once("end", () => resolve(new Blob(chunks, { type: mimeType })))
      .once("error", reject);
  });
}

export default resolveFile;

function resolveBlobType(b: Blob | Blob["type"]) {
  if (typeof b === "string") return b.split("/")[1].split(/\W/)[0];
  return resolveBlobType(b.type);
}
