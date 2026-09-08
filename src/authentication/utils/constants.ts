import { AuthenticationProviderId } from "../enum/providers";
import type { AuthenticationProviderData } from "../interfaces/config";

export const authenticationProviderData: Record<AuthenticationProviderId, AuthenticationProviderData> = {
  [AuthenticationProviderId.discloud]: {},
} as Record<AuthenticationProviderId, AuthenticationProviderData>;