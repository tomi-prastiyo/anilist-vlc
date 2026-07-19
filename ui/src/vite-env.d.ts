/// <reference types="vite/client" />

interface Window {
  api: {
    getConfig: () => Promise<any>;
    updateConfig: (config: any) => Promise<any>;
    loginAnilist: () => Promise<void>;
    generateToken: (code: string) => Promise<boolean>;
    getAuthStatus: () => Promise<boolean>;
    getServiceStatus: () => Promise<any>;
    restartServices: () => Promise<boolean>;
    logoutAnilist: () => Promise<boolean>;
    quitApp: () => void;
    onStatusUpdate: (callback: (data: any) => void) => void;
    removeStatusUpdateListener: () => void;
  };
}
