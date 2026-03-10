import type { ExtensionContext, StatusBarItem, window } from "vscode";
import type { OmitFunction, OmitReadonly } from "./utils";

type VscodeWindowType = typeof window

export type IGlobalStateStorage = ExtensionContext["globalState"]

type ProgressTask = Parameters<VscodeWindowType["withProgress"]>[1]

export type ProgressTaskParameters = Parameters<ProgressTask>

export type CreateStatusBarItemOptions = Parameters<VscodeWindowType["createStatusBarItem"]>

export type StatusBarItemOptions = OmitFunction<StatusBarItem>

export type StatusBarItemData = OmitReadonly<StatusBarItemOptions>

export type VscodeProgressReporter = ProgressTaskParameters[0]
