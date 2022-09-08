const { join, sep } = require("path");

function transPath(path) {
    const sPath = path.split(sep);
    const newPath = join(sPath)
    return newPath;
}

module.exports = { transPath }