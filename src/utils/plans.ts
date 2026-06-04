import { existsSync } from "fs";
import { join } from "path";
import { type TreeItem, Uri } from "vscode";
import core from "../extension";
import { RESOURCES_DIR } from "./constants";

interface PlanDefinition {
  aliases: string[]
  iconName: string
  label: string
  level: number
}

const PLAN_DEFINITIONS: PlanDefinition[] = [
  { aliases: ["free", "gratis", "gratuito"], iconName: "free", label: "Free", level: 0 },
  { aliases: ["carbon", "carbono"], iconName: "carbon", label: "Carbon", level: 1 },
  { aliases: ["gold", "ouro"], iconName: "gold", label: "Gold", level: 2 },
  { aliases: ["platinum", "platina"], iconName: "platinum", label: "Platinum", level: 3 },
  { aliases: ["diamond", "diamante"], iconName: "diamond", label: "Diamond", level: 4 },
  { aliases: ["ruby", "rubi"], iconName: "ruby", label: "Ruby", level: 5 },
  { aliases: ["sapphire", "safira"], iconName: "sapphire", label: "Sapphire", level: 6 },
  { aliases: ["krypton", "cripton", "kryptonita", "criptonita"], iconName: "krypton", label: "Krypton", level: 7 },
  { aliases: ["vibranium"], iconName: "vibranium", label: "Vibranium", level: 8 },
];

function normalizePlanValue(plan: string) {
  return plan
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function getPlanDefinition(plan: string) {
  const normalizedPlan = normalizePlanValue(plan);

  if (!normalizedPlan) return null;

  return PLAN_DEFINITIONS.find(({ aliases }) =>
    aliases.some(alias => normalizedPlan === alias || normalizedPlan.includes(alias)),
  ) ?? null;
}

export function formatPlanLabel(plan: string) {
  return plan;
}

export function canAccessSubdomains(plan?: string | null) {
  const planLevel = plan ? (getPlanDefinition(plan)?.level ?? -1) : -1;
  return planLevel >= 3;
}

export function canAccessCustomDomains(plan?: string | null) {
  const planLevel = plan ? (getPlanDefinition(plan)?.level ?? -1) : -1;
  return planLevel >= 4;
}

export function getPlanIconPath(plan: string): TreeItem["iconPath"] | undefined {
  const iconName = getPlanDefinition(plan)?.iconName;

  if (!iconName) return undefined;

  const iconPath = ["png", "svg"]
    .map(ext => core.context.asAbsolutePath(join(RESOURCES_DIR, "icons", `${iconName}.${ext}`)))
    .find(candidate => existsSync(candidate));

  if (!iconPath) return undefined;

  const iconUri = Uri.file(iconPath);

  return {
    dark: iconUri,
    light: iconUri,
  };
}
