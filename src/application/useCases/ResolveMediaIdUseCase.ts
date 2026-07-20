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

    let bestMatchId = searchMediaIds.find((id) => userMediaIds.has(id));

    if (!bestMatchId && searchResults.length === 0) {
      let searchTitle = title;
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(title)}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json[0]?.[0]?.[0]) searchTitle = json[0][0][0];
        }
      } catch (e) {}

      const searchWords = searchTitle.toLowerCase().split(/\W+/).filter(w => w.length > 2);
      let maxOverlap = 0;
      
      for (const entry of watchingList) {
        const entryTitles = [entry.title, entry.englishTitle, ...(entry.synonyms || [])].filter(Boolean) as string[];
        for (const t of entryTitles) {
          const tWords = t.toLowerCase().split(/\W+/).filter(w => w.length > 2);
          const overlap = searchWords.filter(w => tWords.includes(w)).length;
          if (overlap > maxOverlap && overlap >= 1) {
            maxOverlap = overlap;
            bestMatchId = entry.mediaId;
          }
        }
      }
    }

    return bestMatchId || (searchMediaIds.length > 0 ? searchMediaIds[0] : undefined);
  }
}
