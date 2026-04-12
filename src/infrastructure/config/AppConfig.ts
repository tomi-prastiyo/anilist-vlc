import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig();

/**
 * Application Configuration
 * Centralized configuration loaded from environment variables
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

export const appConfig: AppConfig = {
  vlc: {
    host: "localhost",
    port: Number(process.env.VLC_PORT) || 8080,
    password: process.env.VLC_PW || "",
  },
  anilist: {
    clientId: process.env.ANILIST_CLIENT_ID || "",
    clientSecret: process.env.ANILIST_CLIENT_SECRET || "",
    redirectUri: process.env.ANILIST_REDIRECT || "",
    username: process.env.ANILIST_USERNAME || "",
    authCode: process.env.ANILIST_AUTHTOKEN || "",
    accessToken: process.env.ANILIST_JWT || "",
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT || "",
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
