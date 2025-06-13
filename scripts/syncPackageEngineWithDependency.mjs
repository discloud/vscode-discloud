import { readFile } from "fs/promises";

const PACKAGE_PATH = "package.json";

const [, , engine, dependency] = process.argv;

if (!engine || !dependency) throw new Error("Use: node scripts/syncPackageEngineWithDependency.mjs <engineName> <dependencyName>");

const encodedPackage = await readFile(PACKAGE_PATH, "utf8");

const packageJSON = JSON.parse(encodedPackage);

if (!packageJSON.engines[engine]) throw new Error(`Engine '${engine}' not found on '${PACKAGE_PATH}'`);

const packageJSONDependecyKeyRegexp = /^(dependencies|\w+Dependencies)$/;

let found = false;
for (const key in packageJSON) {
  if (!packageJSONDependecyKeyRegexp.test(key)) continue;
  if (!(dependency in packageJSON[key])) continue;
  packageJSON.engines[engine] = packageJSON[key][dependency];
  found = true;
  break;
}

if (!found) throw new Error(`Dependency '${dependency}' not found on '${PACKAGE_PATH}'`);

console.log(`Engine ${engine} has been updated`);
