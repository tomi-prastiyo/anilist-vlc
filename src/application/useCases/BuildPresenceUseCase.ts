import {
  IAnimeRepository,
  IMediaPlayerAdapter,
  ITitleParser,
  DiscordActivity,
  PlaybackStatus,
  ParsedTitle,
} from "../../domain";

export interface PresenceData {
  activity: DiscordActivity;
  parsedTitle: ParsedTitle;
  playbackStatus: PlaybackStatus;
  stateLabel: string;
}

const DEFAULT_IMAGE = "https://pbs.twimg.com/media/GCSoXH4acAAQWWP.png";

/**
 * Use Case: Build Presence Activity
 * Constructs Discord Rich Presence payload from playback data
 */
export class BuildPresenceUseCase {
  constructor(
    private readonly animeRepository: IAnimeRepository,
    private readonly mediaPlayer: IMediaPlayerAdapter,
    private readonly titleParser: ITitleParser,
  ) {}

  /**
   * Build Discord activity from current playback state
   */
  async execute(username: string): Promise<PresenceData | null> {
    const playbackStatus = await this.mediaPlayer.getPlaybackStatus();
    if (!playbackStatus) return null;

    const parsedTitle = this.titleParser.parse(playbackStatus.title);
    const imageData = await this.getImageData(parsedTitle.title, username);
    const stateLabel = this.capitalize(playbackStatus.state);

    const activity = this.buildActivity(
      playbackStatus,
      parsedTitle,
      imageData,
      stateLabel,
    );

    return { activity, parsedTitle, playbackStatus, stateLabel };
  }

  private async getImageData(
    title: string,
    username: string,
  ): Promise<{ imageUrl: string; imageText: string }> {
    try {
      // Try to get anime cover image
      const searchResults = await this.animeRepository.searchMedia(title);
      if (searchResults.length > 0) {
        const media = await this.animeRepository.getMediaCover(
          searchResults[0].id,
        );
        if (media?.coverImage) {
          return { imageUrl: media.coverImage, imageText: media.title };
        }
      }
    } catch {
      // Fallback to user avatar
      try {
        const avatarUrl = await this.animeRepository.getUserAvatar(username);
        if (avatarUrl) {
          return { imageUrl: avatarUrl, imageText: username };
        }
      } catch {
        // Use default
      }
    }

    return { imageUrl: DEFAULT_IMAGE, imageText: title };
  }

  private buildActivity(
    status: PlaybackStatus,
    parsed: ParsedTitle,
    image: { imageUrl: string; imageText: string },
    stateLabel: string,
  ): DiscordActivity {
    const activity: DiscordActivity = {
      details: image.imageText || parsed.title,
      state: parsed.episode
        ? `${stateLabel} - Episode ${parsed.episode}`
        : stateLabel,
      instance: true,
      largeImageKey: image.imageUrl,
      largeImageText: image.imageText || parsed.title,
      type: 3, // Watching
    };

    if (status.state === "playing") {
      activity.startTimestamp = Math.round(Date.now() / 1000 - status.time);
      activity.endTimestamp = Math.round(
        Date.now() / 1000 + (status.length - status.time),
      );
    }

    return activity;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
