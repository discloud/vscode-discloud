interface User {
  status: string;
  message: string;
  user: {
    userID: string;
    totalRamMb: boolean;
    ramUsedMb: number;
    subdomains: string[];
    customdomains: string[];
    apps: string[];
    appsStatus: App[];
    plan: string;
    locale: string;
  };
}

interface App {
    id: string;
    name: string;
    online: boolean;
    ramKilled: boolean;
    exitCode: number;
}