import { readFile, writeFile } from "fs/promises";

const PACKAGE_PATH = "package.json";

const [, , engine, dependency] = process.argv;

if (!engine || !dependency) throw new Error("Use: node scripts/syncPackageEngineWithDependency.mjs <engineName> <dependencyName>");

const encodedPackage = await readFile(PACKAGE_PATH, "utf8");

const packageJSON = JSON.parse(encodedPackage);

const oldEngineVersion = packageJSON.engines?.[engine];

if (oldEngineVersion === undefined) throw new Error(`Engine '${engine}' not found on '${PACKAGE_PATH}'`);

const packageJSONDependecyKeyRegexp = /^(dependencies|\w+Dependencies)$/;

let found = false, updated = false;
for (const key in packageJSON) {
  if (!packageJSONDependecyKeyRegexp.test(key)) continue;
  if (!(dependency in packageJSON[key])) continue;
  if (oldEngineVersion !== packageJSON[key][dependency]) {
    packageJSON.engines[engine] = packageJSON[key][dependency];
    updated = true;
  }
  found = true;
  break;
}

if (!found) throw new Error(`Dependency '${dependency}' not found on '${PACKAGE_PATH}'`);

if (updated) {
  await writeFile(PACKAGE_PATH, JSON.stringify(packageJSON, null, 2), "utf8");

  console.log(`Engine '${engine}' has been updated to '${packageJSON.engines[engine]}'`);
} else {
  console.log(`Engine '${engine}' is already updated`);
}
