import { readFileSync } from "node:fs";
import { arch, platform, release, type } from "node:os";
import { join } from "node:path";

export const version: string = JSON.parse(readFileSync(join(__dirname, "..", "..", "package.json"), "utf8")).version;
export const os_name = type();
export const os_release = release().split?.(".").slice(0, 2).join(".") ?? release();
export const os_platform = platform();
export const cpu_arch = arch();

export const DiscloudConfigScopes = [
  "ID",
  "TYPE",
  "MAIN",
  "NAME",
  "AVATAR",
  "RAM",
  "VERSION",
  "AUTORESTART",
  "APT",
];

export const requiredScopes = {
  common: [
    "TYPE",
    "MAIN",
    "RAM",
    "VERSION",
  ],
  bot: [
    "NAME",
    "TYPE",
    "MAIN",
    "RAM",
    "VERSION",
  ],
  site: [
    "ID",
    "TYPE",
    "MAIN",
    "RAM",
    "VERSION",
  ],
};

export const blocked_files = {
  common: [".git", ".vscode"],
  go: [],
  js: ["node_modules", "package-lock.json", "yarn.lock"],
  py: [],
  rb: ["Gemfile.lock"],
  rs: ["Cargo.lock", "target"],
  ts: ["node_modules", "package-lock.json", "yarn.lock"],
};

export const blockFilesRegex = RegExp(`(${Object.values(blocked_files).flat().join("|")})`.replace(/\./g, "\\."), "i");

export const required_files = {
  common: ["discloud.config"],
  go: ["go.mod", "go.sum"],
  js: ["package.json"],
  py: ["requirements.txt"],
  rb: ["Gemfile"],
  rs: ["Cargo.toml"],
  ts: ["package.json"],
};
