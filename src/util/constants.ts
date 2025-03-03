import { extname } from "path";

export const FILE_EXT = extname(__filename);

export const NODE_MODULES_EXTENSIONS = new Set<string>([FILE_EXT, ".cjs", ".js", ".mjs"]);

export const DISCLOUD_CONFIG_SCHEMA_FILE_NAME = "discloudconfigschema.json";

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
