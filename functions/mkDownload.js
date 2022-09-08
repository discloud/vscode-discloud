const fs = require('node:fs/promises')
const { fetch } = require('undici')

async function downloadFile(url, path) {
  const res = await fetch(url)

  await fs.writeFile(path, res.body)
  return path;
}

module.exports = { downloadFile }