import { type BaseApiApp, type RESTApiBaseResult } from "@discloudapp/api-types/v2";
import { type AppType } from "../@enum";

export interface RESTGetApiVscode extends RESTApiBaseResult {
  user: ApiVscodeUser
}

export interface ApiVscodeUser {
  apps: string[]
  avatar: string | null
  appsStatus: ApiVscodeApp[]
  appsTeam: string[]
  customdomains: string[]
  locale: string
  plan: string
  ramUsedMb: number
  subdomains: string[]
  totalRamMb: number
  userID: string
  username: string | null
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
  type: AppType
  version: string
}
