import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const config = {
  // VLC
  vlcPassword: process.env.VLC_PW || "",
  vlcPort: process.env.VLC_PORT || 8080,

  // AniList
  anilistAuth: process.env.ANILIST_AUTHTOKEN || "",
  anilistClientId: process.env.ANILIST_CLIENT_ID || "",
  anilistClientSecret: process.env.ANILIST_CLIENT_SECRET || "",
  anilistRedirect: process.env.ANILIST_REDIRECT || "",
  anilistUsername: process.env.ANILIST_USERNAME || "",
  anilistToken: process.env.ANILIST_JWT || "",

  // Discord
  discordClientId: process.env.DISCORD_CLIENT || "",
};
