import { decode } from "jsonwebtoken";
import extension from "../../extension";
import { discloud } from "discloud.app";

export function tokenIsDiscloudJwt(token: string): boolean {
  const payload = decode(token, { json: true });
  return payload && "id" in payload && "key" in payload || false;
}

export async function tokenValidator(token: string, isWorkspace?: boolean) {
  try {
    if (tokenIsDiscloudJwt(token)) {
      if (extension.token === token) {
        extension.rest.tokenIsValid = true;
        await extension.user.fetch(true);
      } else {
        await discloud.login(token);
      }
      extension.emit("authorized", token, isWorkspace);
      return true;
    } else {
      extension.rest.tokenIsValid = false;
      extension.emit("unauthorized");
      return false;
    }
  } catch {
    return false;
  }
}
