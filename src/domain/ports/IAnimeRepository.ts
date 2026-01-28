import { Media, MediaListEntry, MediaStatus } from "../entities";

/**
 * Port: IAnimeRepository
 * Defines the contract for anime data operations
 * This abstraction allows swapping AniList with other providers
 */
export interface IAnimeRepository {
  /**
   * Get user's watching list (CURRENT, PLANNING, REPEATING)
   */
  getWatchingList(username: string): Promise<MediaListEntry[]>;

  /**
   * Search for media by title
   */
  searchMedia(title: string): Promise<Media[]>;

  /**
   * Get current episode progress for a media
   */
  getProgress(mediaId: number, username: string): Promise<number>;

  /**
   * Get the status of a media in user's list
   */
  getMediaStatus(mediaId: number, username: string): Promise<MediaStatus>;

  /**
   * Update episode progress
   */
  updateProgress(
    mediaId: number,
    episode: number,
    status?: MediaStatus,
  ): Promise<number>;

  /**
   * Get media cover image
   */
  getMediaCover(mediaId: number): Promise<Media | null>;

  /**
   * Get user avatar
   */
  getUserAvatar(username: string): Promise<string | null>;
}
