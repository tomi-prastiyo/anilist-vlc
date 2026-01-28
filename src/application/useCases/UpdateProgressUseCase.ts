import { IAnimeRepository, MediaStatus } from "../../domain";

export interface UpdateProgressResult {
  success: boolean;
  mediaId: number;
  episode: number;
  statusChanged: boolean;
}

/**
 * Use Case: Update Watch Progress
 * Updates episode progress and handles status transitions
 */
export class UpdateProgressUseCase {
  constructor(private readonly animeRepository: IAnimeRepository) {}

  /**
   * Update episode progress for a media
   * Automatically transitions PLANNING → CURRENT when progress is made
   */
  async execute(
    mediaId: number,
    episode: number,
    username: string,
  ): Promise<UpdateProgressResult> {
    const currentStatus = await this.animeRepository.getMediaStatus(
      mediaId,
      username,
    );

    let newStatus: MediaStatus | undefined;
    let statusChanged = false;

    // Auto-transition from PLANNING to CURRENT
    if (currentStatus === "PLANNING") {
      newStatus = "CURRENT";
      statusChanged = true;
    }

    const updatedEpisode = await this.animeRepository.updateProgress(
      mediaId,
      episode,
      newStatus,
    );

    return {
      success: true,
      mediaId,
      episode: updatedEpisode,
      statusChanged,
    };
  }
}
