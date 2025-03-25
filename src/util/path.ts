import { join } from "path";
import { BUILD_ROOT_PATH } from "../extension";

export function joinWithBuildRoot(...paths: string[]) {
  return join(BUILD_ROOT_PATH, ...paths);
}
