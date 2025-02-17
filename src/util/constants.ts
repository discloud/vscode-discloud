import { readFileSync } from "fs";
import { arch, platform, release, type } from "os";
import { extname, join } from "path";

export const FILE_EXT = extname(__filename);

export const EXTENSION_ROOT_PATH = join(__dirname, "..", "..");
export let PACKAGE_JSON: Record<any, any> = {};
try { PACKAGE_JSON = JSON.parse(readFileSync(join(EXTENSION_ROOT_PATH, "package.json"), "utf8")); } catch { }
export const VERSION: string = PACKAGE_JSON.version ?? "*";
export const OS_NAME = type();
export const OS_RELEASE = release().split?.(".").slice(0, 2).join(".") ?? release();
export const OS_PLATFORM = platform();
export const CPU_ARCH = arch();

export const DEFAULT_USER_AGENT = `vscode/${VERSION} (${OS_NAME} ${OS_RELEASE}; ${OS_PLATFORM}; ${CPU_ARCH})`;

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
  "BUILD",
  "START",
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
  py: [".venv"],
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
