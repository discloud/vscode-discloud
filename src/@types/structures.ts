import { CancellationToken, ExtensionContext, Progress, ProgressOptions, TreeItem, TreeItemCollapsibleState, TreeItemLabel } from "vscode";
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

export interface AppTreeItemData extends BaseTreeItemData {
  appId?: string
  appType?: string
  children?: AppTreeItem[]
  description?: string
  iconName?: string
  memoryUsage?: number
  tooltip?: string
}

export interface CustomDomainTreeItemData extends BaseTreeItemData {
  domain: string
}

export interface SubDomainTreeItemData extends BaseTreeItemData {
  subdomain: string
}

export interface TeamAppTreeItemData extends BaseTreeItemData {
  appId?: string
  appType?: string
  children?: TeamAppTreeItem[]
  description?: string
  iconName?: string
  memoryUsage?: number
  tooltip?: string
}

export interface TeamAppChildTreeItemData extends BaseTreeItemData {
  appId?: string
  children?: TreeItem[]
  description?: string
  iconName?: string
  tooltip?: string
}

export interface UserTreeItemData extends Partial<BaseTreeItemData> {
  userID?: string
  children?: TeamAppTreeItem[]
  description?: string
  iconName?: string
  tooltip?: string
}

export interface Events {
  activate: [context: ExtensionContext]
  authorized: [token: string, isWorkspace?: boolean]
  error: [error: any]
  noConnection: []
  rateLimited: [rateLimitData: RateLimitData]
  unauthorized: []
  vscode: [user: VSUser]
}
