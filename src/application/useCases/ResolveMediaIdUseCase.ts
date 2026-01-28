import { IAnimeRepository, Media, MediaListEntry } from "../../domain";

/**
 * Use Case: Resolve Media ID
 * Matches a parsed title against user's watching list and search results
 */
export class ResolveMediaIdUseCase {
  constructor(private readonly animeRepository: IAnimeRepository) {}

  /**
   * Find the AniList media ID for a given title
   * Prioritizes matches from user's watching list
   */
  async execute(title: string, username: string): Promise<number | undefined> {
    const [watchingList, searchResults] = await Promise.all([
      this.animeRepository.getWatchingList(username),
      this.animeRepository.searchMedia(title),
    ]);

    const userMediaIds = new Set(watchingList.map((entry) => entry.mediaId));
    const searchMediaIds = searchResults.map((media) => media.id);

    // Return first match found in user's list
    return searchMediaIds.find((id) => userMediaIds.has(id));
  }
}
