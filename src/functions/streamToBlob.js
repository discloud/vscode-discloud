const { Blob } = require("buffer");
const { createReadStream } = require("fs");

module.exports = async function streamtoBlob(file) {
  return new Promise(async (resolve, reject) => {
    const stream = await createReadStream(file);
    const chunks = [];
    stream
      .on("data", (chunk) => chunks.push(chunk))
      .once("end", () => resolve(new Blob(chunks)))
      .once("error", reject);
  });
};
