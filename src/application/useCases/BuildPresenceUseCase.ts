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
const DEFAULT_TEXT = "AniList Anime";

interface ImageData {
  imageUrl: string;
  imageText: string;
  avatarUrl: string;
  avatarText: string;
  animeUrl?: string;
  episodes?: number;
  genres?: string[];
  score?: number;
  season?: string;
  year?: number;
  status?: string;
}

/**
 * Use Case: Build Presence Activity
 * Constructs Discord Rich Presence payload from playback data
 */
export class BuildPresenceUseCase {
  private imageCache = new Map<string, ImageData>();

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
      username,
    );

    return { activity, parsedTitle, playbackStatus, stateLabel };
  }

  private async getImageData(
    title: string,
    username: string,
  ): Promise<ImageData> {
    const cacheKey = `${username}:${title}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    let result: ImageData | null = null;

    try {
      // Try to get anime cover image and details
      const searchResults = await this.animeRepository.searchMedia(title);
      if (searchResults.length > 0) {
        const media = await this.animeRepository.getMediaCover(
          searchResults[0].id,
        );
        const avatarUrl = await this.animeRepository.getUserAvatar(username);
        const animeUrl = `https://anilist.co/anime/${searchResults[0].id}`;
        if (media?.coverImage) {
          result = {
            imageUrl: media.coverImage,
            imageText: media.title,
            avatarUrl: avatarUrl || DEFAULT_IMAGE,
            avatarText: username,
            animeUrl,
            episodes: media.episodes,
            genres: media.genres?.slice(0, 3),
            score: media.averageScore,
            season: media.season,
            year: media.startDate?.year,
            status: media.status,
          };
        }
      }
    } catch {
      // Fallback to user avatar
    }

    if (!result) {
      try {
        const avatarUrl = await this.animeRepository.getUserAvatar(username);
        if (avatarUrl) {
          result = {
            imageUrl: DEFAULT_IMAGE,
            imageText: DEFAULT_TEXT,
            avatarUrl,
            avatarText: username,
          };
        }
      } catch {
        // Use default
      }
    }

    if (!result) {
      result = {
        imageUrl: DEFAULT_IMAGE,
        imageText: DEFAULT_TEXT,
        avatarUrl: DEFAULT_IMAGE,
        avatarText: username,
      };
    }

    this.imageCache.set(cacheKey, result);
    return result;
  }

  private buildActivity(
    status: PlaybackStatus,
    parsed: ParsedTitle,
    image: ImageData,
    stateLabel: string,
    username: string,
  ): DiscordActivity {
    const isPlaying = status.state === "playing";
    const stateIcon = isPlaying ? "▶️" : "⏸️";

    // Build episode progress
    let episodeInfo = "";
    if (parsed.episode) {
      const totalEpisodes = image.episodes || "?";
      const episodeNum = parseInt(parsed.episode);

      episodeInfo = `${stateIcon} Episode ${parsed.episode}/${totalEpisodes}`;

      // Add progress percentage
      if (image.episodes) {
        const progressPercent = Math.round((episodeNum / image.episodes) * 100);
        episodeInfo += ` (${progressPercent}%)`;
      }

      if (!isPlaying) {
        episodeInfo += " • Paused";
      }
    } else {
      episodeInfo = `${stateIcon} ${stateLabel}`;
    }

    // Build details with genre and score
    let details = image.imageText || parsed.title;

    // Build state with additional info
    const stateParts: string[] = [episodeInfo];
    if (image.score) stateParts.push(`★ ${image.score}/100`);
    const state = stateParts.join("  ");

    const activity: DiscordActivity = {
      details: this.truncate(details, 128),
      detailsUrl: image.animeUrl,
      state: this.truncate(state, 128),
      instance: true,
      largeImageKey: image.imageUrl,
      largeImageUrl: image.animeUrl || image.imageUrl,
      largeImageText: this.truncate(
        [
          image.imageText || parsed.title,
          image.season && image.year ? `${image.season} ${image.year}` : null,
          image.genres?.slice(0, 2).join(", ") ?? null,
        ]
          .filter(Boolean)
          .join(" · "),
        128
      ),
      smallImageKey: image.avatarUrl,
      smallImageUrl: `https://anilist.co/user/${username}`,
      smallImageText: this.truncate(`AniList: ${image.avatarText}`, 128),
      type: 3, // 3 means "Watching"
    };

    if (isPlaying) {
      activity.startTimestamp = Math.round(Date.now() / 1000 - status.time);
      activity.endTimestamp = Math.round(
        Date.now() / 1000 + (status.length - status.time),
      );
    }

    const buttons = [];
    if (image.animeUrl) {
      buttons.push({ label: "View Anime", url: image.animeUrl });
    }
    if (username) {
      buttons.push({
        label: "AniList Profile",
        url: `https://anilist.co/user/${username}`,
      });
    }

    if (buttons.length > 0) {
      activity.buttons = buttons;
    }

    return activity;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + "...";
  }
}
