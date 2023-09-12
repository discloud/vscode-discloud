import BitField, { BitFieldResolvable } from "./BitField";

export const ModPermissions = {
  backup_app: 1 << 0,
  commit_app: 1 << 1,
  edit_ram: 1 << 2,
  logs_app: 1 << 3,
  restart_app: 1 << 4,
  start_app: 1 << 5,
  status_app: 1 << 6,
  stop_app: 1 << 7,
} as const;

export type ModPermissionsFlags = keyof typeof ModPermissions;

export type ModPermissionsResolvable = BitFieldResolvable<ModPermissionsFlags, number>;

export class ModPermissionsBF extends BitField<ModPermissionsFlags, number> {
  static Flags = ModPermissions;
  static All = new ModPermissionsBF(Object.values(ModPermissions));
}

export default ModPermissionsBF;
