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
  planDataEnd?: string | null
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

export interface ApiSubdomain {
  date: number
  id: string
  status: number
  userID: string
}

export interface RESTGetApiSubdomainResult extends RESTApiBaseResult {
  subdomain?: ApiSubdomain
}

export interface RESTPostApiSubdomainResult extends RESTApiBaseResult {
  subdomain?: ApiSubdomain
}

export interface RESTDeleteApiSubdomainResult extends RESTApiBaseResult {}

export interface ApiSnapshotVersion {
  date: number | string
  size: number | string
  version: string
}

export interface RESTGetApiSnapshotVersionsResult extends RESTApiBaseResult {
  app?: {
    id: string
  }
  versions?: ApiSnapshotVersion[]
}

export interface RESTGetApiSnapshotDownloadResult extends RESTApiBaseResult {
  app?: {
    id: string
  }
  download?: {
    expiresAt: string
    size: number
    url: string
    version: string
  }
}

export interface RESTPostApiSnapshotResult extends RESTApiBaseResult {
  app?: {
    id: string
  }
  snapshot?: {
    allVersions?: ApiSnapshotVersion[]
    size?: number | string
    url?: string
    version: string
  }
}
