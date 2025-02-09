import { type ExtensionContext, type LogOutputChannel, type ProgressOptions, type TreeItem, type window } from "vscode";
import type AppTreeItem from "../structures/AppTreeItem";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import type VSUser from "../structures/VSUser";
import { type RateLimitData } from "./rest";

export interface CommandData {
  allowTokenless?: boolean
  progress?: ProgressOptions
}

type VscodeWindowType = typeof window

type ProgressTask = Parameters<VscodeWindowType["withProgress"]>[1]

type ProgressTaskParameters = Parameters<ProgressTask>

export interface TaskData {
  progress: ProgressTaskParameters[0]
  token: ProgressTaskParameters[1]
}

export interface BaseTreeItemData extends Omit<TreeItem, "id"> {
  label: NonNullable<TreeItem["label"]>
  children?: TreeItem[] | Map<string, TreeItem>
}

export interface BaseChildTreeItemData extends BaseTreeItemData { }

export interface AppChildTreeItemData extends BaseChildTreeItemData {
  appId: string
  appType: number
  online: boolean
  description: string
  iconName: string
}

export interface AppTreeItemData extends BaseTreeItemData {
  appId: string
  children: AppTreeItem[]
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
  children?: TreeItem[]
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
  appUpdate: [oldApp: AppTreeItem, newApp: AppTreeItem]
  authorized: [token: string, isWorkspace?: boolean]
  debug: Parameters<LogOutputChannel["debug"]>
  error: [error: Error | unknown]
  missingConnection: []
  missingToken: []
  rateLimited: [rateLimitData: RateLimitData]
  teamAppUpdate: [oldTeamApp: TeamAppTreeItem, newTeamApp: TeamAppTreeItem]
  unauthorized: []
  vscode: [user: VSUser]
}
