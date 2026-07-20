import {
  AniListRepository,
  VlcPlayerAdapter,
  WebMediaPlayerAdapter,
  MultiMediaPlayerAdapter,
  DiscordPresenceAdapter,
  AniListAuthAdapter,
  AnimeTitleParser,
} from "../infrastructure";
import { appConfig, reloadConfig } from "../infrastructure/config/AppConfig";
import { logger } from "../infrastructure/logger";
import { StatusPollingController } from "../presentation/controllers/StatusPollingController";
import { configStore } from "../infrastructure/config/ConfigStore";

export class ServiceManager {
  private controller: StatusPollingController | null = null;
  public presenceService: DiscordPresenceAdapter | null = null;
  private mediaPlayer: MultiMediaPlayerAdapter | null = null;
  private webAdapter: WebMediaPlayerAdapter | null = null;

  async start(): Promise<void> {
    logger.info("🎬 Starting anilist-vlc backend service via ServiceManager...");
    reloadConfig(); // Ensure we have the latest config

    // Create infrastructure adapters
    const animeRepository = new AniListRepository(appConfig.anilist.accessToken);

    const vlcAdapter = new VlcPlayerAdapter({
      host: appConfig.vlc.host,
      port: appConfig.vlc.port,
      password: appConfig.vlc.password,
    });

    this.webAdapter = new WebMediaPlayerAdapter();

    this.mediaPlayer = new MultiMediaPlayerAdapter([vlcAdapter, this.webAdapter]);

    this.presenceService = new DiscordPresenceAdapter(
      appConfig.discord.clientId,
    );

    const authService = new AniListAuthAdapter({
      clientId: appConfig.anilist.clientId,
      clientSecret: appConfig.anilist.clientSecret,
      redirectUri: appConfig.anilist.redirectUri,
      authCode: appConfig.anilist.authCode,
      envPath: appConfig.paths.envFile,
    });

    const titleParser = new AnimeTitleParser();

    // Create and start the controller
    this.controller = new StatusPollingController(
      this.presenceService,
      animeRepository,
      this.mediaPlayer,
      authService,
      titleParser,
      appConfig.anilist.username,
      Boolean(appConfig.anilist.authCode),
      Boolean(appConfig.anilist.accessToken),
    );

    await this.controller.start(15000); // Poll every 15 seconds
  }

  stop(): void {
    if (this.controller) {
      logger.info("Stopping backend services...");
      this.controller.stop();
      this.controller = null;
    }
    
    if (this.webAdapter) {
      this.webAdapter.stop();
      this.webAdapter = null;
    }
    
    // Disconnect services if needed
    if (this.presenceService) {
      this.presenceService.disconnect();
    }
  }

  async restart(): Promise<void> {
    this.stop();
    await this.start();
  }

  getStatus() {
    const config = configStore.getConfig();
    // In a real app we might poll VLC or Discord dynamically.
    // For now we return whether they are configured and basic info.
    return {
      discord: {
        connected: this.presenceService ? !!this.presenceService.getUsername() : false,
        username: this.presenceService?.getUsername() || "Unknown",
        error: this.presenceService?.getLastError(),
      },
      vlc: {
        configured: !!config.vlc?.port,
        host: config.vlc?.host || '127.0.0.1',
        port: config.vlc?.port || '8080',
      },
      web: {
        listening: !!this.webAdapter,
        port: 47392
      },
      anilist: {
        authenticated: !!config.anilist?.accessToken,
        username: config.anilist?.username || 'Unknown',
      }
    };
  }
}

export const serviceManager = new ServiceManager();
