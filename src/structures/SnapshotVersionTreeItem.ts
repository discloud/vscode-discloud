import bytes from "bytes";
import { t } from "@vscode/l10n";
import { ThemeIcon } from "vscode";
import { type SnapshotVersionTreeItemData } from "../@types";
import BaseChildTreeItem from "./BaseChildTreeItem";

function formatSnapshotDate(value?: number | string) {
  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) return date.toLocaleString();
  }

  return value ? `${value}` : undefined;
}

function formatSnapshotSize(value?: number | string) {
  if (typeof value === "number")
    return bytes.format(value, { unitSeparator: " " }) ?? `${value} B`;

  return value ? `${value}` : undefined;
}

export default class SnapshotVersionTreeItem extends BaseChildTreeItem {
  readonly contextKey = "SnapshotVersionTreeItem";
  readonly appId: string;
  declare readonly version: string;

  constructor(readonly data: SnapshotVersionTreeItemData) {
    super(data.label ?? data.version, data.collapsibleState);

    this.appId = data.appId;
    this.version = data.version;

    this._patch(data);
  }

  get contextJSON() {
    return {
      appId: this.appId,
      version: this.version,
    };
  }

  _patch(data: Partial<SnapshotVersionTreeItemData>) {
    if (!data) return this;

    super._patch(data);

    if (data.version !== undefined)
      Object.defineProperty(this, "version", { value: data.version, configurable: true });

    this.label = data.version ?? this.label;
    this.description = formatSnapshotSize(data.size) ?? this.description;
    this.tooltip = [
      `${t("snapshot.version")}: ${this.label}`,
      formatSnapshotDate(data.date) ? `${t("snapshot.created.at")}: ${formatSnapshotDate(data.date)}` : null,
      this.description ? `${t("snapshot.size")}: ${this.description}` : null,
    ].filter(Boolean).join("\n");
    this.iconPath = new ThemeIcon("history");

    return this;
  }
}
