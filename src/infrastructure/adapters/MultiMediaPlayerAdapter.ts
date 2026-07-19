import { IMediaPlayerAdapter, PlaybackStatus } from "../../domain";
import { logger } from "../logger";

export class MultiMediaPlayerAdapter implements IMediaPlayerAdapter {
  constructor(private readonly adapters: IMediaPlayerAdapter[]) {}

  async getPlaybackStatus(): Promise<PlaybackStatus | null> {
    let pausedStatus: PlaybackStatus | null = null;

    for (const adapter of this.adapters) {
      try {
        const status = await adapter.getPlaybackStatus();
        
        if (!status) continue;

        // If we find one playing, return it immediately
        if (status.state === "playing") {
          return status;
        }
        
        // If we find one paused, remember it in case none are playing
        if (status.state === "paused" && !pausedStatus) {
          pausedStatus = status;
        }
      } catch (err) {
        // Ignore errors from individual adapters
      }
    }

    return pausedStatus;
  }
}
