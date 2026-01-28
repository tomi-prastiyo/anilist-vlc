import { ITitleParser, ParsedTitle } from "../../domain";

/**
 * Anime Title Parser Adapter
 * Implements ITitleParser for extracting title and episode from filenames
 */
export class AnimeTitleParser implements ITitleParser {
  parse(filename: string): ParsedTitle {
    let title = this.sanitize(filename);
    const [cleanTitle, episode] = this.extractEpisode(title);

    return {
      title: this.finalCleanup(cleanTitle),
      episode,
    };
  }

  private sanitize(title: string): string {
    let result = title.trim();

    // Decode HTML entities
    result = result.replace(/&#39;/g, "'");

    // Remove file extension
    if (result.endsWith(".mkv") || result.endsWith(".mp4")) {
      result = result.slice(0, -4);
    }

    // Remove bracketed content [SubGroup], [1080p], etc.
    result = result.replace(/[\s_.]*\[[^\]]*\][\s_.]*/g, "");

    // Remove parenthesized content (BD), (Dual Audio), etc.
    result = result.replace(/ *\([^)]*\) */g, "");

    // Replace delimiters with spaces if no spaces exist
    if (!result.includes(" ")) {
      result = result.replace(/[\._]/g, " ");
    }

    // Clean up common suffixes
    result = result
      .replace(" Episode Movie", " Episode 01")
      .replace(" Episode OVA", " Episode")
      .replace(" END Subbed", "")
      .replace(" Subbed", "")
      .replace("BD", "");

    return result;
  }

  private extractEpisode(details: string): [string, string] {
    const patterns = [
      { regex: /(episode\s?|ep|e)(\d+)/i, group: 2 },
      { regex: /\d+x(\d+)/i, group: 1 },
      { regex: /(\d+)v\d+/i, group: 1 },
      { regex: /(\d+)$/i, group: 1 },
      { regex: /(\d+)/i, group: 1 },
    ];

    // Try with full string and dash-separated parts
    const parts = [details];
    if (details.includes("-")) {
      const dashIndex = details.indexOf("-");
      parts.push(details.substring(0, dashIndex).trim());
      parts.push(details.substring(dashIndex + 1).trim());
    }

    for (const part of parts) {
      for (const { regex, group } of patterns) {
        const match = part.match(regex);
        if (match && !isNaN(Number(match[group]))) {
          const cleanedPart = part.replace(match[0], "");
          return [cleanedPart, match[group]];
        }
      }
    }

    return [parts.join(", "), ""];
  }

  private finalCleanup(title: string): string {
    let result = title;

    // Remove everything after " - " (usually episode info)
    if (result.includes(" - ")) {
      result = result.substring(0, result.indexOf(" - "));
    }

    return result.trim();
  }
}
