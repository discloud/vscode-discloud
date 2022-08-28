export interface User {
  status: string;
  message: string;
  user: {
    userID: string;
    totalRamMb: boolean;
    ramUsedMb: number;
    subdomains: string[];
    customdomains: string[];
    apps: string[];
    appsStatus: UserApp[];
    plan: string;
    locale: string;
  };
}

export interface UserApp {
  id: string;
  name: string;
  online: boolean;
  ramKilled: boolean;
  exitCode: number;
}

export interface Status {
  status: string;
  message: string;
  apps: App[];
}
export interface App {
  id: string;
  container: string;
  cpu: string;
  memory: string;
  ssd: string;
  netIO: {
    down: string;
    up: string;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  last_restart: string;
  startedAt: string;
}

export interface Backup {
  status: string;
  message: string;
  backups: BackupApp[] | BackupApp;
}

export interface BackupApp {
  id: string;
  url: string;
}