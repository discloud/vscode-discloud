const { requester } = require("./requester");

async function tokenValidator(token) {
  const res = await requester("/vscode", {
    headers: {
      "api-token": `${token}`,
    }
  })

  if (res === 401) return false

  return true
}

module.exports = { tokenValidator }