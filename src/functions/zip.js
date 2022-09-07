const archiver = require("archiver");
const { createWriteStream } = require("fs");

module.exports = class Zip {
  constructor(path, format, options) {
    this.create(path, format, options);
    this.path = path;
  }

  zip = null;
  stream = null;

  create(path, format, options) {
    this.stream = createWriteStream(path);
    this.zip = archiver(format, options);
  }
};
