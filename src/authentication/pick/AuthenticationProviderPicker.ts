import { t } from "@vscode/l10n";
import { window, type QuickPickItem } from "vscode";
import { AuthenticationProviderId } from "../enum/providers";
import { authenticationProviderData } from "../utils/constants";

export async function pickAuthenticationProviderId() {
  const AuthenticationProviderIds = Object.values(AuthenticationProviderId);

  if (AuthenticationProviderIds.length < 2) return AuthenticationProviderIds[0];

  const items: QuickPickItem[] = [];

  for (let i = 0; i < AuthenticationProviderIds.length; i++) {
    const description = AuthenticationProviderIds[i];

    items.push({
      label: t(`authentication.provider.${description}.label`),
      description,
      ...authenticationProviderData[description],
    });
  }

  const result = await window.showQuickPick(items, { ignoreFocusOut: true });

  return result?.description as AuthenticationProviderId;
}
