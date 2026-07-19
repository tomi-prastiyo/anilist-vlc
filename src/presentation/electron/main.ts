import { app, BrowserWindow, Tray, Menu, ipcMain, shell } from 'electron';
import path from 'path';
import { configStore } from '../../infrastructure/config/ConfigStore';
import { logger } from '../../infrastructure/logger';
import { bootstrap } from '../../main/bootstrap';
import { serviceManager } from '../../main/ServiceManager';
import { appConfig, reloadConfig } from '../../infrastructure/config/AppConfig';
import { AniListAuthAdapter } from '../../infrastructure/adapters/AniListAuthAdapter';

// Declare global variables for window and tray
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = !app.isPackaged;

let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    show: false, // Don't show immediately
    title: "AniList VLC Sync",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../../ui/dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    // Hide instead of close to keep it in system tray
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
    return false;
  });
}

function createTray() {
  // Use a default icon or a specific one if available
  // You might want to add a real icon file in assets
  const iconPath = path.join(__dirname, '../../../assets/icon.png');
  // Fallback to a native image if icon is missing (this is just for safety, you should provide an icon)
  
  try {
    tray = new Tray(iconPath);
  } catch (e) {
    // If icon doesn't exist, electron might throw, so we fallback or ignore
    // In production, make sure to add an icon!
    logger.warn("Tray icon not found, please add assets/icon.png");
  }

  if (tray) {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Dashboard', click: () => mainWindow?.show() },
      { type: 'separator' },
      { 
        label: 'Quit', 
        click: () => {
          isQuitting = true;
          app.quit();
        } 
      }
    ]);

    tray.setToolTip('AniList VLC Sync');
    tray.setContextMenu(contextMenu);
    
    tray.on('double-click', () => {
      mainWindow?.show();
    });
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Show window initially when app starts
  mainWindow?.show();

  // Start the background polling logic
  bootstrap().catch(err => {
    logger.error("Failed to bootstrap backend logic", err);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-config', () => {
  return configStore.getConfig();
});

ipcMain.handle('update-config', async (_event, newConfig) => {
  configStore.updateConfig(newConfig);
  await serviceManager.restart();
  return configStore.getConfig();
});

ipcMain.handle('get-service-status', () => {
  return serviceManager.getStatus();
});

ipcMain.handle('restart-services', async () => {
  await serviceManager.restart();
  return true;
});

ipcMain.handle('logout-anilist', async () => {
  configStore.updateConfig({ anilist: { authCode: '', accessToken: '', username: '' } });
  await serviceManager.restart();
  return true;
});

ipcMain.handle('get-auth-status', () => {
  const cfg = configStore.getConfig();
  return Boolean(cfg.anilist?.accessToken && cfg.anilist?.authCode);
});

ipcMain.handle('login-anilist', async () => {
  reloadConfig();
  if (!appConfig.anilist.clientId) {
    throw new Error("AniList Client ID is missing! Please configure it in the Settings tab.");
  }

  const authService = new AniListAuthAdapter({
    clientId: appConfig.anilist.clientId,
    clientSecret: appConfig.anilist.clientSecret,
    redirectUri: appConfig.anilist.redirectUri,
    authCode: '',
    envPath: appConfig.paths.envFile,
  });
  // AniListAuthAdapter uses open() internally which will open the browser.
  await authService.openAuthUrl();
});

ipcMain.handle('generate-token', async (_event, code: string) => {
  reloadConfig();
  if (!appConfig.anilist.clientId) {
    throw new Error("AniList Client ID is missing! Please configure it in the Settings tab.");
  }

  const authService = new AniListAuthAdapter({
    clientId: appConfig.anilist.clientId,
    clientSecret: appConfig.anilist.clientSecret,
    redirectUri: appConfig.anilist.redirectUri,
    authCode: code,
    envPath: appConfig.paths.envFile,
  });
  
  // Save the code to config first
  configStore.updateConfig({ anilist: { authCode: code } });
  
  // Generate and save token
  const token = await authService.generateToken();
  if (token) {
    logger.info("Successfully authenticated with AniList from UI.");
    await serviceManager.restart();
    return true;
  }
  return false;
});

// We need a custom mechanism to tell UI when status changes.
// For now, we'll let StatusPollingController trigger events or we just poll from React.

ipcMain.on('quit-app', () => {
  isQuitting = true;
  app.quit();
});
