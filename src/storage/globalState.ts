import type { IGlobalStateStorage } from "../@types";
import StateStorage from "./state";

export default class GlobalStateStorage extends StateStorage implements IGlobalStateStorage {
  declare protected readonly state: IGlobalStateStorage;

  setKeysForSync(keys: readonly string[]) {
    return this.state.setKeysForSync(keys);
  }
}
