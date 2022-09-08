const archiver = require("archiver");
const { createWriteStream } = require("fs");

class Zip {
  constructor(path, format, options) {
    this.create(path, format, options);
    this.path = path;
    this.zip = null;
    this.stream = null;
  }

  create(path, format, options) {
    this.stream = createWriteStream(path);
    this.zip = archiver(format, options);
  }
};

module.exports = { Zip }