import {
  IAnimeRepository,
  IMediaPlayerAdapter,
  IPresenceService,
  IAuthService,
  ITitleParser,
  ParsedTitle,
} from "../../domain";
import {
  ResolveMediaIdUseCase,
  UpdateProgressUseCase,
  BuildPresenceUseCase,
  AuthenticateUserUseCase,
} from "../../application";
import { logger } from "../../infrastructure/logger";

interface WatchState {
  title: string;
  episode: string;
  previousState: string;
  shouldUpdateAniList: boolean;
}

const UPDATE_THRESHOLD_SECONDS = 300; // 5 minutes before end

/**
 * Status Polling Controller
 * Orchestrates the main application loop
 */
export class StatusPollingController {
  private readonly resolveMediaId: ResolveMediaIdUseCase;
  private readonly updateProgress: UpdateProgressUseCase;
  private readonly buildPresence: BuildPresenceUseCase;
  private readonly authenticate: AuthenticateUserUseCase;

  private state: WatchState = {
    title: "",
    episode: "",
    previousState: "",
    shouldUpdateAniList: true,
  };

  constructor(
    private readonly presenceService: IPresenceService,
    private readonly animeRepository: IAnimeRepository,
    private readonly mediaPlayer: IMediaPlayerAdapter,
    private readonly authService: IAuthService,
    private readonly titleParser: ITitleParser,
    private readonly username: string,
    private readonly hasAuthCode: boolean,
    private readonly hasAccessToken: boolean,
  ) {
    this.resolveMediaId = new ResolveMediaIdUseCase(animeRepository);
    this.updateProgress = new UpdateProgressUseCase(animeRepository);
    this.buildPresence = new BuildPresenceUseCase(
      animeRepository,
      mediaPlayer,
      titleParser,
    );
    this.authenticate = new AuthenticateUserUseCase(authService);
  }

  /**
   * Start the polling controller
   */
  async start(pollingIntervalMs = 15000): Promise<void> {
    this.presenceService.onReady(async () => {
      logger.info(`Connected as ${this.presenceService.getUsername()}`);

      // Handle authentication if needed
      const didAuthenticate = await this.authenticate.execute(
        this.hasAuthCode,
        this.hasAccessToken,
      );

      if (didAuthenticate) {
        logger.info("\n✅ Authentication completed! Tokens saved to config.");
        logger.info("Please restart the application to use the new tokens.");
        process.exit(0);
      }

      // Start polling
      await this.pollStatus();
      setInterval(() => this.pollStatus(), pollingIntervalMs);
    });

    try {
      await this.presenceService.connect();
    } catch (error) {
      logger.error("Failed to connect to Discord initially:", error);
      // We could retry here, but discord-rpc might try reconnecting internally
    }
  }

  private async pollStatus(): Promise<void> {
    try {
      const presenceData = await this.buildPresence.execute(this.username);

      if (!presenceData) {
        // Only log once if state changed to avoid spamming the log when VLC is closed
        if (this.state.previousState !== "Idle") {
          logger.warn("Unable to retrieve playback status (VLC might be closed or stopped).");
          this.state.previousState = "Idle";
        }
        await this.presenceService.clearActivity();
        return;
      }

      const { activity, parsedTitle, playbackStatus, stateLabel } = presenceData;

      // Check for title/episode change
      if (this.hasMediaChanged(parsedTitle)) {
        this.state.title = parsedTitle.title;
        this.state.episode = parsedTitle.episode;
        this.state.shouldUpdateAniList = true;
      }

      // Log state changes
      if (stateLabel !== this.state.previousState) {
        logger.info(
          `${stateLabel} "${parsedTitle.title}" - Episode ${parsedTitle.episode}`,
        );
        this.state.previousState = stateLabel;
      }

      // Update Discord presence
      await this.presenceService.setActivity(activity);

      // Update AniList near episode end
      await this.maybeUpdateAniList(playbackStatus, parsedTitle);
    } catch (error) {
      logger.error("Error in polling loop:", error);
    }
  }

  private hasMediaChanged(parsed: ParsedTitle): boolean {
    return (
      this.state.title !== parsed.title || this.state.episode !== parsed.episode
    );
  }

  private async maybeUpdateAniList(
    status: { length: number; time: number },
    parsed: ParsedTitle,
  ): Promise<void> {
    const timeRemaining = status.length - status.time;
    const nearEnd = timeRemaining < UPDATE_THRESHOLD_SECONDS;

    if (nearEnd && this.state.shouldUpdateAniList && parsed.episode) {
      logger.info("Attempting to update AniList...");

      try {
        const mediaId = await this.resolveMediaId.execute(
          parsed.title,
          this.username,
        );

        if (mediaId) {
          const result = await this.updateProgress.execute(
            mediaId,
            Number(parsed.episode),
            this.username,
          );

          logger.info(
            `Updated AniList: ${parsed.title} - Episode ${result.episode}`,
          );
        }
      } catch (error) {
        logger.error("Error updating AniList:", error);
      }

      this.state.shouldUpdateAniList = false;
    }
  }
}
