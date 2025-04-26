import { Routes } from "discloud.app";
import { decodeJwt } from "jose";
import extension from "../../extension";

export function tokenIsDiscloudJwt(token: string): boolean {
  const payload = decodeJwt(token);
  return payload && "id" in payload && "key" in payload || false;
}

export async function tokenValidator(token: string, isWorkspace?: boolean) {
  try {
    if (tokenIsDiscloudJwt(token)) {
      if (extension.token === token) {
        extension.api.tokenIsValid = true;
        await extension.user.fetch(true);
      } else {
        await extension.api.get(Routes.user(), { headers: { "api-token": token } });
      }
      extension.emit("authorized", token, isWorkspace);
      return true;
    } else {
      extension.api.tokenIsValid = false;
      extension.emit("unauthorized");
      return false;
    }
  } catch {
    extension.api.tokenIsValid = false;
    extension.emit("unauthorized");
    return false;
  }
}
