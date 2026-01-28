import { ParsedTitle } from "../entities";

/**
 * Port: ITitleParser
 * Defines the contract for parsing media titles from filenames
 */
export interface ITitleParser {
  /**
   * Parse a filename into title and episode number
   */
  parse(filename: string): ParsedTitle;
}
