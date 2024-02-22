import { CancellationToken, ExtensionContext, MarkdownString, Progress, ProgressOptions, TreeItem, TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import AppTreeItem from "../structures/AppTreeItem";
import TeamAppTreeItem from "../structures/TeamAppTreeItem";
import VSUser from "../structures/VSUser";
import { RateLimitData } from "./rest";

export interface CommandData {
  noToken?: boolean;
  progress?: ProgressOptions
}

export interface TaskData {
  progress: Progress<{
    message?: string | undefined
    increment?: number | undefined
  }>
  token: CancellationToken
}

export interface BaseTreeItemData {
  collapsibleState?: TreeItemCollapsibleState
  label: string | TreeItemLabel
}

export interface BaseChildTreeItemData extends BaseTreeItemData {
  children?: Map<string, TreeItem> | TreeItem[]
  description?: string | boolean
  tooltip?: string | MarkdownString
}

export interface AppChildTreeItemData extends BaseTreeItemData {
  appId: string
  appType: number
  online: boolean
  description: string
  iconName: string
  tooltip?: string
  children?: TreeItem[] | Map<string, TreeItem>
}

export interface AppTreeItemData extends BaseTreeItemData {
  appId: string
  children: AppTreeItem[]
  description: string
  iconName: string
  memoryUsage: number
  startedAtTimestamp: number
  tooltip: string
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
  error: [error: any]
  missingConnection: []
  missingToken: []
  rateLimited: [rateLimitData: RateLimitData]
  teamAppUpdate: [oldTeamApp: TeamAppTreeItem, newTeamApp: TeamAppTreeItem]
  unauthorized: []
  vscode: [user: VSUser]
}
