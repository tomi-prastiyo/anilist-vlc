/**
 * Domain Entity: Media
 * Represents an anime media item with its core properties
 */
export interface Media {
  id: number;
  title: string;
  coverImage?: string;
  episodes?: number;
  genres?: string[];
  score?: number;
  startDate?: { year?: number; month?: number; day?: number };
  season?: string;
  status?: AnimeStatus;
  description?: string;
  averageScore?: number;
}

export interface MediaListEntry {
  mediaId: number;
  title: string;
  englishTitle?: string;
  synonyms?: string[];
  progress: number;
  status: MediaStatus;
}

export type MediaStatus =
  | "CURRENT"
  | "PLANNING"
  | "COMPLETED"
  | "DROPPED"
  | "PAUSED"
  | "REPEATING";

export type AnimeStatus =
  | "ONGOING"
  | "FINISHED"
  | "NOT_YET_RELEASED"
  | "CANCELLED";
