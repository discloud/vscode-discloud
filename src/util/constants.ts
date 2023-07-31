import { readFileSync } from "node:fs";
import { arch, platform, release, type } from "node:os";
import { join } from "node:path";

export const VERSION: string = JSON.parse(readFileSync(join(__dirname, "..", "..", "package.json"), "utf8")).version;
export const OS_NAME = type();
export const OS_RELEASE = release().split?.(".").slice(0, 2).join(".") ?? release();
export const OS_PLATFORM = platform();
export const CPU_ARCH = arch();

export const DISCLOUD_CONFIG_SCOPES = [
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

export const REQUIRED_SCOPES = {
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

export const BLOCKED_FILES = {
  common: [".cache", ".git", ".vscode"],
  go: [],
  js: ["node_modules", ".npm", "package-lock.json", "yarn.lock"],
  py: ["venv"],
  rb: ["Gemfile.lock"],
  rs: ["Cargo.lock", "target"],
  ts: ["node_modules", ".npm", "package-lock.json", "yarn.lock"],
};

export const ALL_BLOCKED_FILES = Array.from(new Set(Object.values(BLOCKED_FILES).flat()));

export const REQUIRED_FILES = {
  common: ["discloud.config"],
  go: ["go.mod", "go.sum"],
  js: ["package.json"],
  py: ["requirements.txt"],
  rb: ["Gemfile"],
  rs: ["Cargo.toml"],
  ts: ["package.json"],
};
