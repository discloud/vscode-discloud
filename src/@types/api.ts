import type { ApiAppStatus, RESTApiBaseResult } from "discloud.app";

export interface RESTGetApiVscode extends RESTApiBaseResult {
  user: ApiVscodeUser
}

export interface BaseApiApp {
  id: string
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
}

export interface ApiVscodeApp extends ApiAppStatus {
  exitCode: number
  name: string
  online: boolean
  ramKilled: boolean
}
