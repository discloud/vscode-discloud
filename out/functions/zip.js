"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Zip = void 0;
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = require("fs");
class Zip {
    constructor(path, format, options) {
        this.zip = null;
        this.stream = null;
        this.create(path, format, options);
        this.path = path;
    }
    create(path, format, options) {
        this.stream = (0, fs_1.createWriteStream)(path);
        this.zip = (0, archiver_1.default)(format, options);
    }
}
exports.Zip = Zip;
//# sourceMappingURL=zip.js.map