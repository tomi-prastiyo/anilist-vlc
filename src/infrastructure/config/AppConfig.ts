import { config as dotenvConfig } from "dotenv";
import path from "path";
import { configStore } from "./ConfigStore";

dotenvConfig();

/**
 * Application Configuration
 * Centralized configuration loaded from environment variables and JSON config
 */
export interface AppConfig {
  vlc: {
    host: string;
    port: number;
    password: string;
  };
  anilist: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    username: string;
    authCode: string;
    accessToken: string;
  };
  discord: {
    clientId: string;
  };
  paths: {
    envFile: string;
  };
}

const userConfig = configStore.getConfig();

export const appConfig: AppConfig = {
  vlc: {
    host: "localhost",
    port: userConfig.vlc?.port || Number(process.env.VLC_PORT) || 8080,
    password: userConfig.vlc?.password || process.env.VLC_PW || "",
  },
  anilist: {
    clientId: userConfig.anilist?.clientId || process.env.ANILIST_CLIENT_ID || "",
    clientSecret: userConfig.anilist?.clientSecret || process.env.ANILIST_CLIENT_SECRET || "",
    redirectUri: userConfig.anilist?.redirectUri || process.env.ANILIST_REDIRECT || "https://anilist.co/api/v2/oauth/pin",
    username: process.env.ANILIST_USERNAME || "",
    authCode: userConfig.anilist?.authCode || process.env.ANILIST_AUTHTOKEN || "",
    accessToken: userConfig.anilist?.accessToken || process.env.ANILIST_JWT || "",
  },
  discord: {
    clientId: userConfig.discord?.clientId || process.env.DISCORD_CLIENT || "",
  },
  paths: {
    envFile: path.resolve(process.cwd(), ".env"),
  },
};

/**
 * Check if authentication is complete
 */
export const hasValidAuth = (): boolean => {
  return Boolean(appConfig.anilist.authCode && appConfig.anilist.accessToken);
};

export const reloadConfig = (): void => {
  const cfg = configStore.getConfig();
  appConfig.vlc.host = cfg.vlc?.host || "localhost";
  appConfig.vlc.port = cfg.vlc?.port || Number(process.env.VLC_PORT) || 8080;
  appConfig.vlc.password = cfg.vlc?.password || process.env.VLC_PW || "";
  
  appConfig.anilist.authCode = cfg.anilist?.authCode || process.env.ANILIST_AUTHTOKEN || "";
  appConfig.anilist.accessToken = cfg.anilist?.accessToken || process.env.ANILIST_JWT || "";
  appConfig.anilist.username = cfg.anilist?.username || process.env.ANILIST_USERNAME || "";
  
  appConfig.anilist.clientId = cfg.anilist?.clientId || process.env.ANILIST_CLIENT_ID || "";
  appConfig.anilist.clientSecret = cfg.anilist?.clientSecret || process.env.ANILIST_CLIENT_SECRET || "";
  appConfig.anilist.redirectUri = cfg.anilist?.redirectUri || process.env.ANILIST_REDIRECT || "https://anilist.co/api/v2/oauth/pin";
  
  appConfig.discord.clientId = cfg.discord?.clientId || process.env.DISCORD_CLIENT || "";
};
