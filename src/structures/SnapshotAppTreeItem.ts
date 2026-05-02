import path from "path";
import { type AppType } from "../@enum";
import {
  type ApiVscodeApp,
  type RESTGetApiSnapshotVersionsResult,
  type SnapshotAppTreeItemData,
} from "../@types";
import type ExtensionCore from "../core/extension";
import DiscloudAPIError from "../services/discloud/errors/api";
import BaseTreeItem from "./BaseTreeItem";
import SnapshotInfoTreeItem from "./SnapshotInfoTreeItem";
import SnapshotVersionTreeItem from "./SnapshotVersionTreeItem";
import { t } from "@vscode/l10n";
import { ThemeIcon, TreeItemCollapsibleState, Uri } from "vscode";

function getAppSnapshotLabel(app: Partial<ApiVscodeApp>) {
  return app.type === 0 && app.name
    ? `${app.name} (${app.id})`
    : (app.id ?? app.name ?? t("loading"));
}

export default class SnapshotAppTreeItem extends BaseTreeItem<
  SnapshotVersionTreeItem | SnapshotInfoTreeItem
> {
  readonly contextKey = "SnapshotAppTreeItem";
  readonly appId: string;
  declare readonly type: AppType | undefined;
  #loaded = false;

  constructor(readonly data: SnapshotAppTreeItemData) {
    super(
      data.label,
      data.collapsibleState ?? TreeItemCollapsibleState.Collapsed,
    );

    this.appId = data.appId;
    this._patch(data);
  }

  get contextJSON() {
    return {
      appId: this.appId,
      type: this.type ?? null,
    };
  }

  async fetch(core: ExtensionCore, force = false) {
    if (this.#loaded && !force) return this.children.values().toArray();

    this.children.dispose();

    try {
      const response =
        await core.api.queueGet<RESTGetApiSnapshotVersionsResult>(
          `/snapshot/${this.appId}`,
        );
      const versions = response?.versions ?? [];

      if (!versions.length) {
        this.children.set(
          "empty",
          new SnapshotInfoTreeItem(t("no.snapshot.found")),
        );
      } else {
        for (const version of versions) {
          this.children.set(
            version.version,
            new SnapshotVersionTreeItem({
              appId: this.appId,
              command: {
                arguments: [this.appId, version.version],
                command: "discloud.snapshot.download",
                title: t("command.snapshot.download"),
              },
              date: version.date,
              label: version.version,
              size: version.size,
              version: version.version,
            }),
          );
        }
      }

      this.#loaded = true;
      this.description = `${versions.length}`;
    } catch (error) {
      if (error instanceof DiscloudAPIError && error.code === 404) {
        this.children.set(
          "empty",
          new SnapshotInfoTreeItem(t("no.snapshot.found")),
        );
        this.#loaded = true;
        this.description = "0";
      } else {
        throw error;
      }
    }

    return this.children.values().toArray();
  }

  private getTypeIcon() {
    if (this.type === 1) {
      return new ThemeIcon("globe");
    }

    return {
      light: Uri.file(path.join(__dirname, "../resources/light/bot.svg")),
      dark: Uri.file(path.join(__dirname, "../resources/dark/bot.svg")),
    };
  }
  _patch(data: Partial<SnapshotAppTreeItemData>) {
    if (!data) return this;

    super._patch(data);

    if (data.type !== undefined)
      Object.defineProperty(this, "type", {
        value: data.type,
        configurable: true,
      });

    this.label = data.label ?? this.label;
    this.description =
      data.snapshotCount !== undefined
        ? `${data.snapshotCount}`
        : (this.description ?? data.description);
    this.tooltip = data.tooltip ?? `${this.label}`;
    this.iconPath = this.getTypeIcon();
    this.contextValue = `${this.contextKey}.${JSON.stringify(this.contextJSON)}`;

    return this;
  }

  static fromApp(app: ApiVscodeApp) {
    return new SnapshotAppTreeItem({
      appId: app.id,
      description: t("view.snapshot.title"),
      label: getAppSnapshotLabel(app),
      type: app.type,
    });
  }
}