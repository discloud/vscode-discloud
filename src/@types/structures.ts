import type { CancellationToken, ExtensionContext, LogOutputChannel, ProgressOptions, StatusBarItem, TreeItem, Uri, window } from "vscode";
import type BaseChildTreeItem from "../structures/BaseChildTreeItem";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import type UserAppTreeItem from "../structures/UserAppTreeItem";
import type VSUser from "../structures/VSUser";
import type { RateLimitData } from "./rest";

export interface GetWorkspaceFolderOptions {
  /** @default true */
  allowReadSelectedPath?: boolean
  /** @default true */
  fallbackUserChoice?: boolean
  token?: CancellationToken
  uri?: Uri
}

export interface CommandData {
  allowTokenless?: boolean
  progress?: ProgressOptions
}

type VscodeWindowType = typeof window

type ProgressTask = Parameters<VscodeWindowType["withProgress"]>[1]

type ProgressTaskParameters = Parameters<ProgressTask>

export type CreateStatusBarItemOptions = Parameters<VscodeWindowType["createStatusBarItem"]>

export type StatusBarItemOptions = Omit<StatusBarItem, "dispose" | "hide" | "show">

export type StatusBarItemData = Omit<StatusBarItemOptions, "alignment" | "id" | "priority">

export type VscodeProgressReporter = ProgressTaskParameters[0]

export interface TaskData {
  progress: VscodeProgressReporter
  token: ProgressTaskParameters[1]
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
  activate: [context: ExtensionContext]
  appUpdate: [oldApp: UserAppTreeItem, newApp: UserAppTreeItem]
  authorized: []
  debug: Parameters<LogOutputChannel["debug"]>
  error: [error: Error | unknown]
  missingConnection: []
  missingToken: []
  rateLimited: [rateLimitData: RateLimitData]
  teamAppUpdate: [oldTeamApp: TeamAppTreeItem, newTeamApp: TeamAppTreeItem]
  unauthorized: []
  vscode: [user: VSUser]
}
