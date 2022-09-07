const { Discloud } = require("./structures/extend");

module.exports = async function activate(context) {
  new Discloud(context);
};
module.exports = function deactivate() {};
