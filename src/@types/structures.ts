import type { CancellationToken, ExtensionContext, LogOutputChannel, ProgressOptions, TreeItem, Uri } from "vscode";
import type ExtensionCore from "../core/extension";
import type BaseChildTreeItem from "../structures/BaseChildTreeItem";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import type UserAppTreeItem from "../structures/UserAppTreeItem";
import type VSUser from "../structures/VSUser";
import type { RateLimitData } from "./rest";
import type { VscodeProgressReporter } from "./vscode";

export interface GetWorkspaceFolderOptions {
  /** @default true */
  allowReadSelectedPath?: boolean
  /** @default false */
  silent?: boolean
  token?: CancellationToken
  uri?: Uri
}

export interface CommandData {
  allowTokenless?: boolean
  progress?: ProgressOptions
}

export interface TaskData {
  progress: VscodeProgressReporter
  token: CancellationToken
  signal: AbortSignal
}

export interface BaseTreeItemData extends Omit<TreeItem, "id"> {
  label: NonNullable<TreeItem["label"]>
  children?: TreeItem[] | Map<string, TreeItem>
}

export interface BaseChildTreeItemData extends Omit<TreeItem, "id"> {
  label: NonNullable<TreeItem["label"]>
}

export interface UserAppChildTreeItemData extends BaseChildTreeItemData {
  appId: string
  appType: number
  online: boolean
  description: string
  iconName: string
}

export interface UserAppTreeItemData extends BaseTreeItemData {
  appId: string
  children: UserAppTreeItem[]
  description: string
  iconName: string
  memoryUsage: number
  startedAtTimestamp: number
}

export interface CustomDomainTreeItemData extends BaseTreeItemData {
  domain: string
}

export interface SubDomainTreeItemData extends BaseTreeItemData {
  subdomain: string
}

export interface TeamAppTreeItemData extends BaseTreeItemData {
  appId?: string
  children?: TeamAppTreeItem[]
  description?: string
  iconName?: string
  memoryUsage?: number
  startedAtTimestamp?: number
  tooltip?: string
}

export interface TeamAppChildTreeItemData extends BaseChildTreeItemData {
  appId: string
  appType: number | null
  online: boolean | null
  children?: BaseChildTreeItem[]
  description?: string
  iconName?: string
  tooltip?: string
}

export interface UserTreeItemData extends BaseTreeItemData {
  userID: string
  description: string
  children?: TeamAppTreeItem[]
  iconName?: string
  tooltip?: string
}

export interface Events {
  activate: [core: ExtensionCore, context: ExtensionContext]
  appUpdate: [core: ExtensionCore, oldApp: UserAppTreeItem, newApp: UserAppTreeItem]
  authorized: [core: ExtensionCore]
  debug: [core: ExtensionCore, ...Parameters<LogOutputChannel["debug"]>]
  error: [core: ExtensionCore, error: Error | unknown]
  missingConnection: [core: ExtensionCore]
  missingToken: [core: ExtensionCore]
  rateLimited: [core: ExtensionCore, rateLimitData: RateLimitData]
  teamAppUpdate: [core: ExtensionCore, oldTeamApp: TeamAppTreeItem, newTeamApp: TeamAppTreeItem]
  unauthorized: [core: ExtensionCore]
  vscode: [core: ExtensionCore, user: VSUser]
}
