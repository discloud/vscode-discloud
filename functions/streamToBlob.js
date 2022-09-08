const { Blob } = require("buffer");
const { createReadStream } = require("fs");

async function streamtoBlob(file) {
  return new Promise(async (resolve, reject) => {
    const stream = await createReadStream(file);
    const chunks = [];
    stream
      .on("data", (chunk) => chunks.push(chunk))
      .once("end", () => resolve(new Blob(chunks)))
      .once("error", reject);
  });
};

module.exports = { streamtoBlob }