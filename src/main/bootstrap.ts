/**
 * Composition Root
 * Wires up all dependencies using dependency injection
 * This is the only place where concrete implementations are referenced
 */
import {
  AniListRepository,
  VlcPlayerAdapter,
  DiscordPresenceAdapter,
  AniListAuthAdapter,
  AnimeTitleParser,
  appConfig,
} from "../infrastructure";
import { StatusPollingController } from "../presentation";

async function bootstrap(): Promise<void> {
  console.log("🎬 Starting anilist-vlc...\n");

  // Create infrastructure adapters
  const animeRepository = new AniListRepository(appConfig.anilist.accessToken);

  const mediaPlayer = new VlcPlayerAdapter({
    host: appConfig.vlc.host,
    port: appConfig.vlc.port,
    password: appConfig.vlc.password,
  });

  const presenceService = new DiscordPresenceAdapter(
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
  const controller = new StatusPollingController(
    presenceService,
    animeRepository,
    mediaPlayer,
    authService,
    titleParser,
    appConfig.anilist.username,
    Boolean(appConfig.anilist.authCode),
    Boolean(appConfig.anilist.accessToken),
  );

  await controller.start(15000); // Poll every 15 seconds
}

// Start the application
bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
