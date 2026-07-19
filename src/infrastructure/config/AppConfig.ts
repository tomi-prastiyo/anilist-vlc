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
    clientId: process.env.ANILIST_CLIENT_ID || "",
    clientSecret: process.env.ANILIST_CLIENT_SECRET || "",
    redirectUri: process.env.ANILIST_REDIRECT || "",
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
