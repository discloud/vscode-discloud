const archiver = require("archiver");
const { createWriteStream } = require("fs");

class Zip {
  constructor(path, format, options) {
    this.create(path, format, options);
    this.path = path;
  }

  create(path, format, options) {
    this.stream = createWriteStream(path);
    this.zip = archiver(format, options);
  }
};

module.exports = { Zip }