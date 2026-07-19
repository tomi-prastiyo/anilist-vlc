import {
  IAnimeRepository,
  Media,
  MediaListEntry,
  MediaStatus,
} from "../../domain";
import { RateLimitManager } from "./RateLimitManager";
import { RateLimitStatusService } from "./RateLimitStatusService";

const API_URL = "https://graphql.anilist.co";

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string; status?: number }>;
}

/**
 * AniList GraphQL API Adapter
 * Implements IAnimeRepository for AniList integration
 */
export class AniListRepository implements IAnimeRepository {
  private readonly rateLimitManager: RateLimitManager;

  constructor(private readonly accessToken?: string) {
    this.rateLimitManager = new RateLimitManager();
    // Register with status service for monitoring
    RateLimitStatusService.getInstance().registerManager(
      "anilist",
      this.rateLimitManager,
    );
  }

  private async query<T>(
    query: string,
    variables: Record<string, any>,
    authenticated = false,
  ): Promise<T> {
    return this.rateLimitManager.queueRequest(async () => {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          // Wait for available rate limit slot
          await this.rateLimitManager.waitForAvailableSlot();

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
          };

          if (authenticated && this.accessToken) {
            headers.Authorization = `Bearer ${this.accessToken}`;
          }

          const response = await fetch(API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables }),
          });

          // Update rate limit info from response headers
          this.rateLimitManager.updateFromHeaders(response.headers);

          // Handle 429 Too Many Requests
          if (response.status === 429) {
            await this.rateLimitManager.handleRateLimitError(response.headers);
            retries++;
            continue;
          }

          const data: GraphQLResponse<T> = await response.json();

          // Handle GraphQL errors
          if (data.errors?.length) {
            const error = data.errors[0];

            // If it's a rate limit error from GraphQL response
            if (error.status === 429) {
              await this.rateLimitManager.handleRateLimitError(
                response.headers,
              );
              retries++;
              continue;
            }

            throw new Error(error.message);
          }

          return data.data;
        } catch (error) {
          // If it's a rate limit error, retry after waiting
          if (
            error instanceof Error &&
            error.message.includes("Too Many Requests")
          ) {
            retries++;
            if (retries < maxRetries) {
              console.warn(
                `[RateLimit] Retrying request (attempt ${retries + 1}/${maxRetries})...`,
              );
              await this.sleep(Math.pow(2, retries) * 1000); // Exponential backoff
              continue;
            }
          }

          throw error;
        }
      }

      throw new Error("Max retries exceeded for rate limited request");
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getWatchingList(username: string): Promise<MediaListEntry[]> {
    const query = `
      query ($page: Int, $perPage: Int, $userName: String) {
        Page (page: $page, perPage: $perPage) {
          pageInfo { currentPage, hasNextPage }
          mediaList (userName: $userName, status_in: [PLANNING, CURRENT, REPEATING], type: ANIME, sort: MEDIA_TITLE_ROMAJI) {
            mediaId
            media { title { romaji } }
            progress
            status
          }
        }
      }
    `;

    let page = 1;
    const perPage = 50;
    const allEntries: MediaListEntry[] = [];
    let hasNextPage = true;

    while (hasNextPage) {
      const data = await this.query<{
        Page: {
          pageInfo: { hasNextPage: boolean };
          mediaList: Array<{
            mediaId: number;
            media: { title: { romaji: string } };
            progress: number;
            status: MediaStatus;
          }>;
        };
      }>(query, { page, perPage, userName: username });

      const entries = data.Page.mediaList.map((item) => ({
        mediaId: item.mediaId,
        title: item.media.title.romaji,
        progress: item.progress,
        status: item.status,
      }));

      allEntries.push(...entries);
      hasNextPage = data.Page.pageInfo.hasNextPage;
      page++;
    }

    return allEntries;
  }

  async searchMedia(title: string): Promise<Media[]> {
    const query = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          media (search: $search, type: ANIME) {
            id
            title { romaji }
            coverImage { large }
            episodes
            genres
            averageScore
            status
            season
            startDate { year month day }
          }
        }
      }
    `;

    const data = await this.query<{
      Page: {
        media: Array<{
          id: number;
          title: { romaji: string };
          coverImage: { large: string };
          episodes?: number;
          genres?: string[];
          averageScore?: number;
          status?: string;
          season?: string;
          startDate?: { year?: number; month?: number; day?: number };
        }>;
      };
    }>(query, { search: title, page: 1, perPage: 20 });

    return data.Page.media.map((item) => ({
      id: item.id,
      title: item.title.romaji,
      coverImage: item.coverImage?.large,
      episodes: item.episodes,
      genres: item.genres,
      averageScore: item.averageScore,
      status: item.status as any,
      season: item.season,
      startDate: item.startDate,
    }));
  }

  async getProgress(mediaId: number, username: string): Promise<number> {
    const query = `
      query ($mediaId: Int, $userName: String) {
        MediaList (mediaId: $mediaId, userName: $userName) {
          progress
        }
      }
    `;

    const data = await this.query<{ MediaList: { progress: number } }>(query, {
      mediaId,
      userName: username,
    });

    return data.MediaList.progress;
  }

  async getMediaStatus(
    mediaId: number,
    username: string,
  ): Promise<MediaStatus> {
    const query = `
      query ($mediaId: Int, $userName: String) {
        MediaList (mediaId: $mediaId, userName: $userName) {
          status
        }
      }
    `;

    const data = await this.query<{ MediaList: { status: MediaStatus } }>(
      query,
      {
        mediaId,
        userName: username,
      },
    );

    return data.MediaList.status;
  }

  async updateProgress(
    mediaId: number,
    episode: number,
    status?: MediaStatus,
  ): Promise<number> {
    const query = status
      ? `
        mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
          SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
            progress
          }
        }
      `
      : `
        mutation ($mediaId: Int, $progress: Int) {
          SaveMediaListEntry (mediaId: $mediaId, progress: $progress) {
            progress
          }
        }
      `;

    const variables: Record<string, any> = { mediaId, progress: episode };
    if (status) variables.status = status;

    const data = await this.query<{ SaveMediaListEntry: { progress: number } }>(
      query,
      variables,
      true,
    );

    return data.SaveMediaListEntry.progress;
  }

  async getMediaCover(mediaId: number): Promise<Media | null> {
    const query = `
      query ($mediaId: Int) {
        Media (id: $mediaId) {
          id
          title { romaji }
          coverImage { large }
          episodes
          genres
          averageScore
          status
          season
          startDate { year month day }
          description
        }
      }
    `;

    const data = await this.query<{
      Media: {
        id: number;
        title: { romaji: string };
        coverImage: { large: string };
        episodes?: number;
        genres?: string[];
        averageScore?: number;
        status?: string;
        season?: string;
        startDate?: { year?: number; month?: number; day?: number };
        description?: string;
      };
    }>(query, { mediaId });

    return {
      id: data.Media.id,
      title: data.Media.title.romaji,
      coverImage: data.Media.coverImage?.large,
      episodes: data.Media.episodes,
      genres: data.Media.genres,
      averageScore: data.Media.averageScore,
      status: data.Media.status as any,
      season: data.Media.season,
      startDate: data.Media.startDate,
      description: data.Media.description,
    };
  }

  async getUserAvatar(username: string): Promise<string | null> {
    const query = `
      query ($name: String) {
        User (name: $name) {
          avatar { large }
        }
      }
    `;

    const data = await this.query<{ User: { avatar: { large: string } } }>(
      query,
      {
        name: username,
      },
    );

    return data.User.avatar?.large ?? null;
  }
}
