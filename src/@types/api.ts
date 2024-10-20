import type { BaseApiApp, RESTApiBaseResult } from "discloud.app";
import { type AppType } from "../@enum";

export interface RESTGetApiVscode extends RESTApiBaseResult {
  user: ApiVscodeUser
}

export interface ApiVscodeUser {
  apps: string[]
  appsStatus: ApiVscodeApp[]
  appsTeam: string[]
  customdomains: string[]
  locale: string
  plan: string
  ramUsedMb: number
  subdomains: string[]
  totalRamMb: number
  userID: string
  userName: string
}

export interface ApiVscodeApp extends BaseApiApp {
  apts: string[]
  autoRestart: boolean
  avatarURL: string
  clusterName: string
  exitCode: number
  lang: string
  mainFile: string
  name: string
  online: boolean
  ram: number
  ramKilled: boolean
  syncGit: string | null
  type: AppType
  version: string
}
