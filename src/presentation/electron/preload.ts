import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Config Store API
    getConfig: () => ipcRenderer.invoke('get-config'),
    updateConfig: (config: any) => ipcRenderer.invoke('update-config', config),
    
    // Auth API
    loginAnilist: () => ipcRenderer.invoke('login-anilist'),
    generateToken: (code: string) => ipcRenderer.invoke('generate-token', code),
    getAuthStatus: () => ipcRenderer.invoke('get-auth-status'),
    logoutAnilist: () => ipcRenderer.invoke('logout-anilist'),

    // Service Control
    getServiceStatus: () => ipcRenderer.invoke('get-service-status'),
    restartServices: () => ipcRenderer.invoke('restart-services'),

    // App Control
    quitApp: () => ipcRenderer.send('quit-app'),
    
    // Receive status updates from backend
    onStatusUpdate: (callback: (data: any) => void) => {
      ipcRenderer.on('status-update', (_event, data) => callback(data));
    },
    removeStatusUpdateListener: () => {
      ipcRenderer.removeAllListeners('status-update');
    }
  }
);
