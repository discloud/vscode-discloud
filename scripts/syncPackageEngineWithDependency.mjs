import { readFile, writeFile } from "fs/promises";

const INDENTATION = 2;
const PACKAGE_PATH = "package.json";

const [, , engine, dependency] = process.argv;

if (!engine || !dependency) throw new Error("Use: node scripts/syncPackageEngineWithDependency.mjs <engineName> <dependencyName>");

const encodedPackage = await readFile(PACKAGE_PATH, "utf8");

/** @type {import("type-fest").PackageJson} */
const packageJSON = JSON.parse(encodedPackage);

packageJSON.engines ??= {};

const oldEngineVersion = packageJSON.engines[engine];

const packageJSONDependencyKeyRegexp = /^(dependencies|\w+Dependencies)$/;

let found = false, updated = false;
for (const key in packageJSON) {
  if (!packageJSONDependencyKeyRegexp.test(key)) continue;
  if (!(dependency in packageJSON[key])) continue;
  found = true;
  if (oldEngineVersion === packageJSON[key][dependency]) break;
  packageJSON.engines[engine] = packageJSON[key][dependency];
  updated = true;
  break;
}

if (!found) throw new Error(`Dependency '${dependency}' not found on '${PACKAGE_PATH}'`);

if (updated) {
  await writeFile(PACKAGE_PATH, JSON.stringify(packageJSON, null, INDENTATION), "utf8");

  console.log(`Engine '${engine}' has been updated to '${packageJSON.engines[engine]}'`);
} else {
  console.log(`Engine '${engine}' is already updated`);
}
