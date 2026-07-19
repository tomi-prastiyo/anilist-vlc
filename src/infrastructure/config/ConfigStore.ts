import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Interface for the application configuration stored in JSON
 */
export interface UserConfig {
  vlc?: {
    port?: number;
    password?: string;
  };
  anilist?: {
    authCode?: string;
    accessToken?: string;
  };
  discord?: {
    clientId?: string;
  };
}

export class ConfigStore {
  private configPath: string;

  constructor() {
    // Save to ~/.anilist-vlc/config.json
    const configDir = path.join(os.homedir(), '.anilist-vlc');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    this.configPath = path.join(configDir, 'config.json');
    this.ensureConfigExists();
  }

  private ensureConfigExists() {
    if (!fs.existsSync(this.configPath)) {
      this.writeConfig({});
    }
  }

  public getConfig(): UserConfig {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data) as UserConfig;
    } catch (error) {
      console.error('Error reading config file:', error);
      return {};
    }
  }

  public updateConfig(newConfig: Partial<UserConfig>) {
    const currentConfig = this.getConfig();
    
    // Deep merge for 1 level
    const updatedConfig = { ...currentConfig };
    
    if (newConfig.vlc) {
      updatedConfig.vlc = { ...currentConfig.vlc, ...newConfig.vlc };
    }
    if (newConfig.anilist) {
      updatedConfig.anilist = { ...currentConfig.anilist, ...newConfig.anilist };
    }
    if (newConfig.discord) {
      updatedConfig.discord = { ...currentConfig.discord, ...newConfig.discord };
    }

    this.writeConfig(updatedConfig);
  }

  private writeConfig(config: UserConfig) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing config file:', error);
    }
  }

  public get path(): string {
    return this.configPath;
  }
}

// Singleton instance
export const configStore = new ConfigStore();
