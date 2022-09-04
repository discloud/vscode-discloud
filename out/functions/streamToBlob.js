"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamtoBlob = void 0;
const buffer_1 = require("buffer");
const fs_1 = require("fs");
async function streamtoBlob(file) {
    return new Promise(async (resolve, reject) => {
        const stream = await (0, fs_1.createReadStream)(file);
        const chunks = [];
        stream
            .on("data", chunk => chunks.push(chunk))
            .once("end", () => resolve(new buffer_1.Blob(chunks)))
            .once("error", reject);
    });
}
exports.streamtoBlob = streamtoBlob;
//# sourceMappingURL=streamToBlob.js.map