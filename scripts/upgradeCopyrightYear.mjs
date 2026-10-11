import { readFile, writeFile } from "fs/promises";

const ENCODING = "utf8";
const LICENSE_PATH = "LICENSE";

const copyrightRegexp = /(Copyright) (\d{4})(?:-(\d{4}))? (.*)/;

const oldLicenseContent = await readFile(LICENSE_PATH, ENCODING);

const newLicenseContent = oldLicenseContent.replace(copyrightRegexp, (old, left, oldYear, newYear, right) => {
  const year = new Date().getFullYear();
  if (year === oldYear || year === newYear) return old;
  return `${left} ${oldYear}-${year} ${right}`;
});

if (oldLicenseContent === newLicenseContent) {
  console.log("License copyright year is already updated");
} else {
  await writeFile(LICENSE_PATH, newLicenseContent, ENCODING);
  console.log("License copyright year has been updated");
}
