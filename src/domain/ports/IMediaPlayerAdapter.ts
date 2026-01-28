import { PlaybackStatus } from "../entities";

/**
 * Port: IMediaPlayerAdapter
 * Defines the contract for media player integrations
 * This abstraction allows swapping VLC with other players
 */
export interface IMediaPlayerAdapter {
  /**
   * Get current playback status from the media player
   */
  getPlaybackStatus(): Promise<PlaybackStatus | null>;
}
