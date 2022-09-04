import { Blob } from "buffer";
import { BinaryLike } from "crypto";
import { createReadStream } from "fs";

export async function streamtoBlob(file: string) {
    return new Promise(async (resolve, reject) => {
        const stream = await createReadStream(file);
        const chunks: (Blob | BinaryLike)[] | (string | Buffer)[] = [];
        stream
            .on("data", chunk => chunks.push(chunk))
            .once("end", () => resolve(new Blob(chunks)))
            .once("error", reject);
    });
}