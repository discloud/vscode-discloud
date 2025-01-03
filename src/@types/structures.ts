import { type CancellationToken, type ExtensionContext, type LogOutputChannel, type Progress, type ProgressOptions, type TreeItem } from "vscode";
import type AppTreeItem from "../structures/AppTreeItem";
import type TeamAppTreeItem from "../structures/TeamAppTreeItem";
import type VSUser from "../structures/VSUser";
import { type RateLimitData } from "./rest";

export interface CommandData {
  allowTokenless?: boolean;
  progress?: ProgressOptions
}

export interface TaskData {
  progress: Progress<{
    message?: string | undefined
    increment?: number | undefined
  }>
  token: CancellationToken
}

export interface BaseTreeItemData extends Omit<TreeItem, "id"> {
  label: NonNullable<TreeItem["label"]>
  children?: TreeItem[] | Map<string, TreeItem>
}

export interface BaseChildTreeItemData extends BaseTreeItemData { }

export interface AppChildTreeItemData extends BaseTreeItemData {
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

export interface TeamAppChildTreeItemData extends BaseTreeItemData {
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
  debug: Parameters<LogOutputChannel["info"]>
  error: [error: Error | unknown]
  missingConnection: []
  missingToken: []
  rateLimited: [rateLimitData: RateLimitData]
  teamAppUpdate: [oldTeamApp: TeamAppTreeItem, newTeamApp: TeamAppTreeItem]
  unauthorized: []
  vscode: [user: VSUser]
}
