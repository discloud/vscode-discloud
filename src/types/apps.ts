module.exports = interface User {
  status: string;
  message: string;
  user: {
    userID: string;
    totalRamMb: number;
    ramUsedMb: number;
    subdomains: [];
    customdomains: [];
    apps: string[];
    appsStatus: App[];
    plan: string;
    locale: string;
    lastDataLeft: {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
    };
    planDataEnd: string;
  };
}

module.exports = interface App {
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
  online: boolean;
  ramKilled: boolean;
  exitCode: number;
  name: string;
}

module.exports = interface Backup {
  status: string;
  message: string;
  backups: BackupApp[] | BackupApp;
}

module.exports = interface BackupApp {
  id: string;
  url: string;
}

module.exports = interface Logs {
  status: string;
  message: string;
  apps: AppLog | AppLog[];
}

module.exports = interface AppLog {
  id: string;
  terminal: {
    big: string;
    small: string;
    url: string;
  };
}
