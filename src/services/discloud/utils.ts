import { decodeJwt } from "jose";
import { type RESTGetApiVscode } from "../../@types";
import core from "../../extension";
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
    const oldToken = await core.secrets.getToken();

    if (!tokenIsDiscloudJwt(token)) {
      if (oldToken === token) core.emit("unauthorized");
      return false;
    }

    if (oldToken === token) {
      core.emit("authorized");
      await core.user.fetch(true);
      return true;
    }

    const response = await fetch(`${core.api.baseURL}/vscode`, { headers: { "api-token": token } });

    if (response.status === 401) return false;

    const data = await response.json() as RESTGetApiVscode;

    if ("user" in data) {
      Object.assign(core.user, data.user);
      core.emit("vscode", core.user);
    }

    core.emit("authorized");

    return true;
  } catch (error: any) {
    if (error instanceof DiscloudAPIError) {
      switch (error.code) {
        case 401:
          await core.secrets.setToken();
          core.emit("unauthorized");
          return false;
      }
      return false;
    }

    switch (error.code) {
      case NETWORK_UNREACHABLE_CODE: return core.emit("missingConnection"), null;
      default: return false;
    }
  }
}
