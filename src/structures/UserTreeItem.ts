import { t } from "@vscode/l10n";
import { ThemeIcon, TreeItemCollapsibleState, Uri } from "vscode";
import { type ApiVscodeUser, type UserTreeItemData } from "../@types";
import { canAccessCustomDomains, canAccessSubdomains, formatPlanLabel, getPlanIconPath } from "../utils/plans";
import { getIconPath, getThemedResourceIconPath } from "../utils/utils";
import BaseTreeItem from "./BaseTreeItem";
import UserChildTreeItem from "./UserChildTreeItem";

function getUserFallbackIconPath() {
  return getThemedResourceIconPath(
    "resources/icons/discloud_white_icon.svg",
    "resources/icons/discloud_icon.svg",
  );
}

function formatRamValue(value: number, locale?: string) {
  return `${new Intl.NumberFormat(locale || "pt-BR").format(value)} MB`;
}

function capitalizeFirstLetter(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatLocaleLabel(locale: string) {
  const normalizedLocale = locale.replace("_", "-");
  const [languageCode = normalizedLocale, regionCode] = normalizedLocale.split("-");

  try {
    const languageLabel = new Intl.DisplayNames([normalizedLocale], { type: "language" }).of(languageCode);

    if (!languageLabel) return locale;

    return regionCode
      ? `${capitalizeFirstLetter(languageLabel)} ${regionCode.toUpperCase()}`
      : capitalizeFirstLetter(languageLabel);
  } catch {
    return locale;
  }
}

function getUserDetailsIcons() {
  return {
    apps: getIconPath("container"),
    domains: new ThemeIcon("globe"),
    locale: new ThemeIcon("globe"),
    planDataEnd: new ThemeIcon("calendar"),
    ram: getIconPath("ram"),
    subdomains: new ThemeIcon("link"),
    team: new ThemeIcon("organization"),
  };
}

export default class UserTreeItem extends BaseTreeItem<UserChildTreeItem> {
  iconName?: string;
  readonly userID: string;

  constructor(readonly data: Partial<UserTreeItemData> & ApiVscodeUser) {
    data.label = data.userID;

    super(data.label, data.collapsibleState);

    this.userID = data.userID;

    this._patch(data);
  }

  protected _patch(data: Partial<UserTreeItemData & ApiVscodeUser>): this {
    if (!data) return this;

    const userDetailsIcons = getUserDetailsIcons();

    this.iconPath = getUserFallbackIconPath();

    if (data.avatar)
      try { this.iconPath = Uri.parse(data.avatar); } catch { }

    super._patch(data);

    if (data.username)
      this.label = data.username + ` (${this.userID})`;

    if (data.children instanceof Map) {
      for (const [id, child] of data.children) {
        this.children.set(id, child);
      }
    }

    if (typeof data.ramUsedMb === "number" && typeof data.totalRamMb === "number")
      this._addChild("ram", {
        label: `${formatRamValue(data.ramUsedMb, data.locale)}/${formatRamValue(data.totalRamMb, data.locale)}`,
        description: t("label.available.ram"),
        iconPath: userDetailsIcons.ram,
        userID: this.userID,
      });

    if (data.plan)
      this._addChild("plan", {
        label: formatPlanLabel(data.plan),
        description: t("plan"),
        iconPath: getPlanIconPath(data.plan),
        userID: this.userID,
      });

    if ("planDataEnd" in data && typeof data.planDataEnd === "string")
      this._addChild("planDataEnd", {
        label: new Date(data.planDataEnd).toJSON() ?
          new Date(data.planDataEnd).toLocaleDateString() :
          data.planDataEnd,
        description: t("label.plan.expiration"),
        iconPath: userDetailsIcons.planDataEnd,
        userID: this.userID,
      });

    if (data.locale)
      this._addChild("locale", {
        label: formatLocaleLabel(data.locale),
        description: t("locale"),
        iconPath: userDetailsIcons.locale,
        userID: this.userID,
      });

    if (data.apps)
      this._addChild("apps", {
        label: `${data.apps.length}`,
        description: t("label.apps.amount"),
        iconPath: userDetailsIcons.apps,
        userID: this.userID,
      });

    if (data.appsTeam)
      this._addChild("team", {
        label: `${data.appsTeam.length}`,
        description: t("label.team.apps.amount"),
        iconPath: userDetailsIcons.team,
        userID: this.userID,
      });

    if (data.plan && data.customdomains && canAccessCustomDomains(data.plan))
      this._addChild("domains", {
        label: `${data.customdomains.length}`,
        description: t("label.domains.amount"),
        iconPath: userDetailsIcons.domains,
        userID: this.userID,
      });
    else
      this.children.delete("domains");

    if (data.plan && data.subdomains && canAccessSubdomains(data.plan))
      this._addChild("subdomains", {
        label: `${data.subdomains.length}`,
        description: t("label.subdomains.amount"),
        iconPath: userDetailsIcons.subdomains,
        userID: this.userID,
      });
    else
      this.children.delete("subdomains");

    this.collapsibleState =
      this.children.size ?
        this.data.collapsibleState ??
        TreeItemCollapsibleState.Expanded :
        TreeItemCollapsibleState.None;

    return this;
  }

  private _addChild(id: string, data: UserTreeItemData) {
    const existing = this.children.get(id);

    if (existing) {
      existing._patch(data);
      return;
    }

    this.children.set(id, new UserChildTreeItem(data));
  }
}
