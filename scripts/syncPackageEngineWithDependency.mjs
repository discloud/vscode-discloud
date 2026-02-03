import { readFile, writeFile } from "fs/promises";

const ENCODING = "utf8";
const INDENTATION = 2;
const PACKAGE_PATH = "package.json";
const PACKAGE_DEPENDENCY_KEYS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const [, , engine, dependency] = process.argv;

if (!engine || !dependency) throw new Error("Use: node scripts/syncPackageEngineWithDependency.mjs <engineName> <dependencyName>");

const encodedPackage = await readFile(PACKAGE_PATH, ENCODING);

/** @type {import("type-fest").PackageJson} */
const packageJSON = JSON.parse(encodedPackage);

packageJSON.engines ??= {};

const oldEngineVersion = packageJSON.engines[engine];

let found = false, updated = false;
for (const key of PACKAGE_DEPENDENCY_KEYS) {
  if (!(dependency in packageJSON[key])) continue;
  found = true;
  if (oldEngineVersion === packageJSON[key][dependency]) break;
  packageJSON.engines[engine] = packageJSON[key][dependency];
  updated = true;
  break;
}

if (!found) throw new Error(`Dependency '${dependency}' not found on '${PACKAGE_PATH}'`);

if (updated) {
  const content = JSON.stringify(packageJSON, null, INDENTATION);

  await writeFile(PACKAGE_PATH, content, ENCODING);

  console.log(`Engine '${engine}' has been updated to '${packageJSON.engines[engine]}'`);
} else {
  console.log(`Engine '${engine}' is already updated`);
}
