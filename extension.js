const Discloud = require("./structures/extend");

async function activate(context) {
  new Discloud(context);
};
function deactivate() {};

module.exports = { activate, deactivate }