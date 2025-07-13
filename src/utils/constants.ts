import { makeCamelizedPair } from "./utils";

export const DISCLOUD_CONFIG_SCHEMA_FILE_NAME = "discloudconfigschema.json";

export const RESOURCES_DIR = "resources";

export const NODE_MODULES_EXTENSIONS = Object.freeze(new Set<string>([".cjs", ".js", ".mjs"]));

export const EMPTY_TREE_ITEM_ID = "x" as const;

export const BLOCKED_FILES = Object.freeze({
  common: [".cache", ".git", ".vscode"],
  go: [],
  js: ["node_modules", ".npm", "package-lock.json", "yarn.lock"],
  py: [".venv"],
  rb: ["Gemfile.lock"],
  rs: ["Cargo.lock", "target"],
  ts: ["node_modules", ".npm", "package-lock.json", "yarn.lock"],
} as const);

export const REQUIRED_FILES = Object.freeze({
  common: ["discloud.config"],
  go: ["go.mod", "go.sum"],
  js: ["package.json"],
  py: ["requirements.txt"],
  rb: ["Gemfile"],
  rs: ["Cargo.toml"],
  ts: ["package.json"],
} as const);

const CONFIG_KEYS = Object.freeze([
  "debug",
  "token",
  "users",
  "api.actions.strategy",
  "app.backup.dir",
  "app.import.dir",
  "app.notification.status",
  "app.separate.by.type",
  "app.show.avatar.instead.status",
  "app.sort.by",
  "app.sort.online",
  "status.bar.behavior",
  "team.backup.dir",
  "team.import.dir",
  "team.app.notification.status",
  "team.sort.by",
  "team.sort.online",
] as const);

const TREE_VIEW_IDS = Object.freeze([
  "discloudUserApps",
  "discloudTeamApps",
  "discloudSubdomains",
  "discloudDomains",
  "discloudUser",
] as const);

const SORT_BY = Object.freeze([
  "id.asc",
  "id.desc",
  "memory.usage.asc",
  "memory.usage.desc",
  "name.asc",
  "name.desc",
  "none",
  "started.asc",
  "started.desc",
] as const);

const API_ACTIONS_STRATEGY = Object.freeze([
  "rest",
  "socket",
] as const);

const SECRET_KEYS = Object.freeze([
  "token",
] as const);

export const TreeViewIds = Object.freeze(makeCamelizedPair(TREE_VIEW_IDS));

export const ConfigKeys = Object.freeze(makeCamelizedPair(CONFIG_KEYS));

export const SortBy = Object.freeze(makeCamelizedPair(SORT_BY));

export const ApiActionsStrategy = Object.freeze(makeCamelizedPair(API_ACTIONS_STRATEGY));

export const SecretKeys = Object.freeze(makeCamelizedPair(SECRET_KEYS));
