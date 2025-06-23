import { decodeJwt } from "jose";
import { type RESTGetApiVscode } from "../../@types";
import extension from "../../extension";
import { NETWORK_UNREACHABLE_CODE } from "./constants";
import DiscloudAPIError from "./errors/api";

export function tokenIsDiscloudJwt(token: string): boolean {
  try {
    const payload = decodeJwt(token);
    return payload && "id" in payload && "key" in payload || false;
  } catch { return false; }
}

export async function tokenValidator(token: string) {
  try {
    if (!tokenIsDiscloudJwt(token)) {
      if (extension.token === token) extension.emit("unauthorized");
      return false;
    }

    if (extension.token === token) {
      extension.api.tokenIsValid = true;
      await extension.user.fetch(true);
      return true;
    }

    const response = await fetch(`${extension.api.baseURL}/vscode`, { headers: { "api-token": token } });

    if (response.status === 401) return false;

    const data = await response.json() as RESTGetApiVscode;

    if ("user" in data) {
      Object.assign(extension.user, data.user);
      extension.emit("vscode", extension.user);
    }

    extension.emit("authorized");

    return true;
  } catch (error: any) {
    if (error instanceof DiscloudAPIError) {
      switch (error.code) {
        case 401:
          extension.emit("unauthorized");
          return false;
      }
      return false;
    }

    switch (error.code) {
      case NETWORK_UNREACHABLE_CODE: return extension.emit("missingConnection"), null;
      default:
        return false;
    }
  }
}
