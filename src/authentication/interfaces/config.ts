import type { QuickInputButton } from "vscode";

export interface AuthenticationProviderData {
  readonly buttons?: readonly QuickInputButton[]
}
